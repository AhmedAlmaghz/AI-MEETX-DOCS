import { inject, injectable } from 'tsyringe';

import type { MeetingId, Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  AnalyticsActorClaims,
  AnalyticsDateRange,
  AnalyticsGranularity,
  MeetingAnalyticsSummary,
  MeetingEndedAnalyticsPayload,
  MeetingFact,
  PlatformDailySummary,
  PlatformMetricsSummary,
  RecordingReadyAnalyticsPayload,
  TenantDailySummary,
  TranslationAnalyticsPayload,
} from '../model/analytics.js';
import {
  ANALYTICS_LIMITS,
  calculateDurationMinutes,
  canReadPlatformAnalytics,
  canReadTenantAnalytics,
  toUtcDate,
} from '../model/analytics.js';
import type {
  AnalyticsSummaryRepository,
  MeetingFactRepository,
  UserEngagementRepository,
} from '../port/analytics-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

function validateRange(range: AnalyticsDateRange): Error | null {
  const from = new Date(`${range.from}T00:00:00.000Z`);
  const to = new Date(`${range.to}T00:00:00.000Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return new Error('Invalid analytics date range');
  }
  if (from.getTime() > to.getTime()) {
    return new Error('Analytics date range from must be before to');
  }
  const days = Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;
  if (days > ANALYTICS_LIMITS.MAX_RANGE_DAYS) {
    return new Error('Analytics date range cannot exceed 12 months');
  }
  return null;
}

function assertTenantAnalyticsAccess(actor: AnalyticsActorClaims, tenantId: string): Error | null {
  if (!canReadTenantAnalytics(actor.role)) return new Error('Tenant analytics access denied');
  if (actor.role === 'super_admin') return null;
  return actor.tenantId === tenantId ? null : new Error('Tenant analytics access denied');
}

function escapeCsv(value: string | number | boolean): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function buildMeetingFact(payload: MeetingEndedAnalyticsPayload): MeetingFact {
  return {
    meetingId: payload.meetingId,
    tenantId: payload.tenantId,
    hostId: payload.hostId,
    startedAt: payload.startedAt,
    endedAt: payload.endedAt,
    durationMinutes: calculateDurationMinutes(payload.startedAt, payload.endedAt),
    peakParticipants: payload.peakParticipants,
    totalParticipants: payload.totalParticipants,
    recordingEnabled: payload.recordingEnabled ?? false,
    recordingMinutes: 0,
    aiEnabled: payload.aiEnabled ?? false,
    translationEnabled: payload.translationEnabled ?? false,
    translationMinutes: 0,
    classroomMode: payload.classroomMode ?? false,
  };
}

export interface ConsumeMeetingEndedCommand {
  readonly payload: MeetingEndedAnalyticsPayload;
}

@injectable()
export class MeetingEndedConsumer implements UseCase<ConsumeMeetingEndedCommand, MeetingFact, Error> {
  constructor(
    @inject(TOKENS.MeetingFactRepository)
    private readonly meetingFactRepository: MeetingFactRepository,
    @inject(TOKENS.UserEngagementRepository)
    private readonly userEngagementRepository: UserEngagementRepository,
  ) {}

  async execute(command: ConsumeMeetingEndedCommand): Promise<Result<MeetingFact, Error>> {
    const fact = buildMeetingFact(command.payload);
    const insertResult = await this.meetingFactRepository.insert(fact);
    if (insertResult.isFailure) return failure(insertResult.error);

    const engagementResult = await this.userEngagementRepository.incrementHosted({
      tenantId: fact.tenantId,
      userId: fact.hostId,
      date: toUtcDate(fact.endedAt),
    });
    if (engagementResult.isFailure) return failure(engagementResult.error);

    return success(insertResult.value);
  }
}

export interface ConsumeRecordingReadyCommand {
  readonly payload: RecordingReadyAnalyticsPayload;
}

@injectable()
export class RecordingReadyConsumer implements UseCase<ConsumeRecordingReadyCommand, MeetingFact, Error> {
  constructor(
    @inject(TOKENS.MeetingFactRepository)
    private readonly meetingFactRepository: MeetingFactRepository,
  ) {}

  async execute(command: ConsumeRecordingReadyCommand): Promise<Result<MeetingFact, Error>> {
    return this.meetingFactRepository.update(command.payload.meetingId, {
      recordingEnabled: true,
      recordingMinutes: command.payload.recordingMinutes,
    });
  }
}

export interface ConsumeTranslationCommand {
  readonly payload: TranslationAnalyticsPayload;
}

@injectable()
export class TranslationConsumer implements UseCase<ConsumeTranslationCommand, MeetingFact, Error> {
  constructor(
    @inject(TOKENS.MeetingFactRepository)
    private readonly meetingFactRepository: MeetingFactRepository,
  ) {}

  async execute(command: ConsumeTranslationCommand): Promise<Result<MeetingFact, Error>> {
    return this.meetingFactRepository.update(command.payload.meetingId, {
      translationEnabled: true,
      translationMinutesDelta: Math.ceil(command.payload.durationMs / 60_000),
    });
  }
}

export interface RunAnalyticsAggregationCommand {
  readonly range: AnalyticsDateRange;
}

@injectable()
export class RunAnalyticsAggregationJobUseCase implements UseCase<RunAnalyticsAggregationCommand, void, Error> {
  constructor(
    @inject(TOKENS.MeetingFactRepository)
    private readonly meetingFactRepository: MeetingFactRepository,
    @inject(TOKENS.UserEngagementRepository)
    private readonly userEngagementRepository: UserEngagementRepository,
    @inject(TOKENS.AnalyticsSummaryRepository)
    private readonly summaryRepository: AnalyticsSummaryRepository,
  ) {}

  async execute(command: RunAnalyticsAggregationCommand): Promise<Result<void, Error>> {
    const rangeError = validateRange(command.range);
    if (rangeError) return failure(rangeError);

    const factsResult = await this.meetingFactRepository.findByDateRange(command.range);
    if (factsResult.isFailure) return failure(factsResult.error);

    const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
    const tenantDateFacts = new Map<string, MeetingFact[]>();
    for (const fact of factsResult.value) {
      const key = `${fact.tenantId}:${toUtcDate(fact.endedAt)}`;
      tenantDateFacts.set(key, [...(tenantDateFacts.get(key) ?? []), fact]);
    }

    for (const facts of tenantDateFacts.values()) {
      const first = facts[0];
      if (!first) continue;
      const engagementResult = await this.userEngagementRepository.findByTenantAndDateRange(first.tenantId, {
        from: toUtcDate(first.endedAt),
        to: toUtcDate(first.endedAt),
      });
      if (engagementResult.isFailure) return failure(engagementResult.error);

      const summary: TenantDailySummary = {
        tenantId: first.tenantId,
        date: toUtcDate(first.endedAt),
        dailyActiveUsers: new Set(engagementResult.value.map((fact) => fact.userId)).size,
        totalMeetings: facts.length,
        totalMeetingMinutes: facts.reduce((sum, fact) => sum + fact.durationMinutes, 0),
        totalRecordingMinutes: facts.reduce((sum, fact) => sum + fact.recordingMinutes, 0),
        totalTranslationMinutes: facts.reduce((sum, fact) => sum + fact.translationMinutes, 0),
        lastComputedAt: now,
      };
      const upsertResult = await this.summaryRepository.upsertTenantDailySummary(summary);
      if (upsertResult.isFailure) return failure(upsertResult.error);
    }

    const activeUsersResult = await this.userEngagementRepository.findActiveUsers(command.range);
    if (activeUsersResult.isFailure) return failure(activeUsersResult.error);
    const tenants = new Set(factsResult.value.map((fact) => fact.tenantId));
    const platformSummary: PlatformDailySummary = {
      date: command.range.to,
      dailyActiveUsers: activeUsersResult.value.size,
      monthlyActiveUsers: activeUsersResult.value.size,
      totalTenants: tenants.size,
      totalMeetings: factsResult.value.length,
      totalMeetingMinutes: factsResult.value.reduce((sum, fact) => sum + fact.durationMinutes, 0),
      totalRecordingMinutes: factsResult.value.reduce((sum, fact) => sum + fact.recordingMinutes, 0),
      totalTranslationMinutes: factsResult.value.reduce((sum, fact) => sum + fact.translationMinutes, 0),
      lastComputedAt: now,
    };
    const platformResult = await this.summaryRepository.upsertPlatformDailySummary(platformSummary);
    if (platformResult.isFailure) return failure(platformResult.error);

    return success(undefined);
  }
}

export interface GetMeetingAnalyticsCommand {
  readonly actor: AnalyticsActorClaims;
  readonly tenantId: string;
  readonly range: AnalyticsDateRange;
  readonly granularity?: AnalyticsGranularity;
}

@injectable()
export class GetMeetingAnalyticsUseCase
  implements UseCase<GetMeetingAnalyticsCommand, MeetingAnalyticsSummary, Error>
{
  constructor(
    @inject(TOKENS.AnalyticsSummaryRepository)
    private readonly summaryRepository: AnalyticsSummaryRepository,
  ) {}

  async execute(command: GetMeetingAnalyticsCommand): Promise<Result<MeetingAnalyticsSummary, Error>> {
    const accessError = assertTenantAnalyticsAccess(command.actor, command.tenantId);
    if (accessError) return failure(accessError);
    const rangeError = validateRange(command.range);
    if (rangeError) return failure(rangeError);

    return this.summaryRepository.getMeetingAnalytics({
      tenantId: command.tenantId as import('../model/analytics.js').AnalyticsTenantId,
      range: command.range,
      granularity: command.granularity ?? 'daily',
    });
  }
}

export interface GetPlatformMetricsCommand {
  readonly actor: AnalyticsActorClaims;
  readonly range: AnalyticsDateRange;
}

@injectable()
export class GetPlatformMetricsUseCase implements UseCase<GetPlatformMetricsCommand, PlatformMetricsSummary, Error> {
  constructor(
    @inject(TOKENS.AnalyticsSummaryRepository)
    private readonly summaryRepository: AnalyticsSummaryRepository,
  ) {}

  async execute(command: GetPlatformMetricsCommand): Promise<Result<PlatformMetricsSummary, Error>> {
    if (!canReadPlatformAnalytics(command.actor.role)) {
      return failure(new Error('Platform analytics require super admin role'));
    }
    const rangeError = validateRange(command.range);
    if (rangeError) return failure(rangeError);
    return this.summaryRepository.getPlatformMetrics(command.range);
  }
}

export interface ExportMeetingReportCommand {
  readonly actor: AnalyticsActorClaims;
  readonly tenantId: string;
  readonly range: AnalyticsDateRange;
}

@injectable()
export class ExportMeetingReportUseCase implements UseCase<ExportMeetingReportCommand, string, Error> {
  constructor(
    @inject(TOKENS.MeetingFactRepository)
    private readonly meetingFactRepository: MeetingFactRepository,
  ) {}

  async execute(command: ExportMeetingReportCommand): Promise<Result<string, Error>> {
    const accessError = assertTenantAnalyticsAccess(command.actor, command.tenantId);
    if (accessError) return failure(accessError);
    const rangeError = validateRange(command.range);
    if (rangeError) return failure(rangeError);

    const factsResult = await this.meetingFactRepository.findByTenantAndDateRange(
      command.tenantId as import('../model/analytics.js').AnalyticsTenantId,
      command.range,
    );
    if (factsResult.isFailure) return failure(factsResult.error);

    const headers = [
      'meetingId',
      'tenantId',
      'hostId',
      'startedAt',
      'endedAt',
      'durationMinutes',
      'peakParticipants',
      'totalParticipants',
      'recordingEnabled',
      'recordingMinutes',
      'aiEnabled',
      'translationEnabled',
      'translationMinutes',
      'classroomMode',
    ];
    const rows = factsResult.value.map((fact) => [
      fact.meetingId,
      fact.tenantId,
      fact.hostId,
      fact.startedAt,
      fact.endedAt,
      fact.durationMinutes,
      fact.peakParticipants,
      fact.totalParticipants,
      fact.recordingEnabled,
      fact.recordingMinutes,
      fact.aiEnabled,
      fact.translationEnabled,
      fact.translationMinutes,
      fact.classroomMode,
    ]);

    return success([headers.join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n'));
  }
}

export interface MarkMeetingAiEnabledCommand {
  readonly meetingId: MeetingId;
}

@injectable()
export class AiReportConsumer implements UseCase<MarkMeetingAiEnabledCommand, MeetingFact, Error> {
  constructor(
    @inject(TOKENS.MeetingFactRepository)
    private readonly meetingFactRepository: MeetingFactRepository,
  ) {}

  async execute(command: MarkMeetingAiEnabledCommand): Promise<Result<MeetingFact, Error>> {
    return this.meetingFactRepository.update(command.meetingId, { aiEnabled: true });
  }
}
