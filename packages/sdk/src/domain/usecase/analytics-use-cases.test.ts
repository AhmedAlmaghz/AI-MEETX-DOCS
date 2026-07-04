import 'reflect-metadata';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IsoDateString, MeetingId, OrganizationId, UserId } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  AnalyticsActorClaims,
  AnalyticsDateRange,
  AnalyticsGranularity,
  AnalyticsTenantId,
  MeetingAnalyticsSummary,
  MeetingFact,
  PlatformMetricsSummary,
  UserEngagementFact,
} from '../model/analytics.js';
import type {
  AnalyticsSummaryRepository,
  MeetingFactRepository,
  MeetingFactUpdate,
  UserEngagementRepository,
} from '../port/analytics-repository.js';
import {
  ExportMeetingReportUseCase,
  GetMeetingAnalyticsUseCase,
  GetPlatformMetricsUseCase,
  MeetingEndedConsumer,
  RecordingReadyConsumer,
  RunAnalyticsAggregationJobUseCase,
  TranslationConsumer,
} from './analytics-use-cases.js';

const tenantId = 'tenant_analytics' as OrganizationId;
const meetingId = 'meeting_analytics' as MeetingId;
const hostId = 'user_host' as UserId;
const startedAt = '2026-01-01T10:00:00.000Z' as IsoDateString;
const endedAt = '2026-01-01T11:30:00.000Z' as IsoDateString;

const tenantAdmin: AnalyticsActorClaims = {
  userId: hostId,
  role: 'tenant_admin',
  tenantId,
};

const superAdmin: AnalyticsActorClaims = {
  userId: hostId,
  role: 'super_admin',
};

function range(): AnalyticsDateRange {
  return { from: '2026-01-01', to: '2026-01-01' };
}

function createMeetingFact(overrides: Partial<MeetingFact> = {}): MeetingFact {
  return {
    meetingId,
    tenantId,
    hostId,
    startedAt,
    endedAt,
    durationMinutes: 90,
    peakParticipants: 12,
    totalParticipants: 15,
    recordingEnabled: false,
    recordingMinutes: 0,
    aiEnabled: false,
    translationEnabled: false,
    translationMinutes: 0,
    classroomMode: false,
    ...overrides,
  };
}

class InMemoryMeetingFactRepository implements MeetingFactRepository {
  readonly facts = new Map<MeetingId, MeetingFact>();

  async insert(fact: MeetingFact) {
    this.facts.set(fact.meetingId, fact);
    return success(fact);
  }

  async getByMeetingId(id: MeetingId) {
    return success(this.facts.get(id) ?? null);
  }

  async update(id: MeetingId, update: MeetingFactUpdate) {
    const current = this.facts.get(id);
    if (!current) return failure(new Error('Meeting fact not found'));
    const updated: MeetingFact = {
      ...current,
      recordingEnabled: update.recordingEnabled ?? current.recordingEnabled,
      recordingMinutes: update.recordingMinutes ?? current.recordingMinutes,
      aiEnabled: update.aiEnabled ?? current.aiEnabled,
      translationEnabled: update.translationEnabled ?? current.translationEnabled,
      translationMinutes: current.translationMinutes + (update.translationMinutesDelta ?? 0),
    };
    this.facts.set(id, updated);
    return success(updated);
  }

  async findByTenantAndDateRange(id: AnalyticsTenantId) {
    return success([...this.facts.values()].filter((fact) => fact.tenantId === id));
  }

  async findByDateRange() {
    return success([...this.facts.values()]);
  }
}

class InMemoryUserEngagementRepository implements UserEngagementRepository {
  readonly facts = new Map<string, UserEngagementFact>();

  async incrementHosted(input: { readonly tenantId: AnalyticsTenantId; readonly userId: UserId; readonly date: string }) {
    const key = `${input.tenantId}:${input.userId}:${input.date}`;
    const current = this.facts.get(key) ?? {
      tenantId: input.tenantId,
      userId: input.userId,
      date: input.date,
      meetingsHosted: 0,
      meetingsAttended: 0,
      totalMeetingMinutes: 0,
    };
    const updated = { ...current, meetingsHosted: current.meetingsHosted + 1 };
    this.facts.set(key, updated);
    return success(updated);
  }

  async incrementAttended(input: {
    readonly tenantId: AnalyticsTenantId;
    readonly userId: UserId;
    readonly date: string;
    readonly meetingMinutes: number;
  }) {
    const key = `${input.tenantId}:${input.userId}:${input.date}`;
    const current = this.facts.get(key) ?? {
      tenantId: input.tenantId,
      userId: input.userId,
      date: input.date,
      meetingsHosted: 0,
      meetingsAttended: 0,
      totalMeetingMinutes: 0,
    };
    const updated = {
      ...current,
      meetingsAttended: current.meetingsAttended + 1,
      totalMeetingMinutes: current.totalMeetingMinutes + input.meetingMinutes,
    };
    this.facts.set(key, updated);
    return success(updated);
  }

  async findByTenantAndDateRange(id: AnalyticsTenantId) {
    return success([...this.facts.values()].filter((fact) => fact.tenantId === id));
  }

  async findActiveUsers() {
    return success(new Set([...this.facts.values()].map((fact) => fact.userId)));
  }
}

class InMemorySummaryRepository implements AnalyticsSummaryRepository {
  tenantSummaries: unknown[] = [];
  platformSummaries: unknown[] = [];

  async getMeetingAnalytics(input: {
    readonly tenantId: AnalyticsTenantId;
    readonly range: AnalyticsDateRange;
    readonly granularity: AnalyticsGranularity;
  }) {
    const summary: MeetingAnalyticsSummary = {
      tenantId: input.tenantId,
      granularity: input.granularity,
      from: input.range.from,
      to: input.range.to,
      series: [],
    };
    return success(summary);
  }

  async getPlatformMetrics(input: AnalyticsDateRange) {
    const summary: PlatformMetricsSummary = {
      from: input.from,
      to: input.to,
      dailyActiveUsers: 1,
      monthlyActiveUsers: 1,
      totalMeetings: 1,
      totalMeetingMinutes: 90,
      totalRecordingMinutes: 20,
      totalTranslationMinutes: 2,
    };
    return success(summary);
  }

  async upsertTenantDailySummary(summary: unknown) {
    this.tenantSummaries.push(summary);
    return success(undefined);
  }

  async upsertPlatformDailySummary(summary: unknown) {
    this.platformSummaries.push(summary);
    return success(undefined);
  }
}

describe('Phase 09 analytics event consumers', () => {
  let meetingFacts: InMemoryMeetingFactRepository;
  let engagement: InMemoryUserEngagementRepository;

  beforeEach(() => {
    meetingFacts = new InMemoryMeetingFactRepository();
    engagement = new InMemoryUserEngagementRepository();
  });

  it('inserts a meeting fact when a meeting ends', async () => {
    const consumer = new MeetingEndedConsumer(meetingFacts, engagement);

    const result = await consumer.execute({
      payload: {
        meetingId,
        tenantId,
        hostId,
        startedAt,
        endedAt,
        peakParticipants: 12,
        totalParticipants: 15,
      },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.durationMinutes).toBe(90);
      expect(result.value.totalParticipants).toBe(15);
    }
    expect(engagement.facts.size).toBe(1);
  });

  it('updates recording facts from RecordingReadyConsumer', async () => {
    await meetingFacts.insert(createMeetingFact());
    const consumer = new RecordingReadyConsumer(meetingFacts);

    const result = await consumer.execute({ payload: { meetingId, recordingMinutes: 20 } });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.recordingEnabled).toBe(true);
      expect(result.value.recordingMinutes).toBe(20);
    }
  });

  it('accumulates translation minutes without storing raw transcript text', async () => {
    await meetingFacts.insert(createMeetingFact());
    const consumer = new TranslationConsumer(meetingFacts);

    const result = await consumer.execute({
      payload: { meetingId, durationMs: 61_000 },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.translationEnabled).toBe(true);
      expect(result.value.translationMinutes).toBe(2);
      expect(JSON.stringify(result.value)).not.toContain('originalText');
      expect(JSON.stringify(result.value)).not.toContain('translatedText');
    }
  });
});

describe('Phase 09 aggregation job and analytics queries', () => {
  it('computes tenant and platform summaries from facts', async () => {
    const meetingFacts = new InMemoryMeetingFactRepository();
    const engagement = new InMemoryUserEngagementRepository();
    const summaries = new InMemorySummaryRepository();
    await meetingFacts.insert(createMeetingFact({ recordingMinutes: 20, translationMinutes: 2 }));
    await engagement.incrementHosted({ tenantId, userId: hostId, date: '2026-01-01' });

    const job = new RunAnalyticsAggregationJobUseCase(meetingFacts, engagement, summaries);
    const result = await job.execute({ range: range() });

    expect(result.isSuccess).toBe(true);
    expect(summaries.tenantSummaries).toHaveLength(1);
    expect(summaries.platformSummaries).toHaveLength(1);
    expect(summaries.tenantSummaries[0]).toMatchObject({
      totalMeetings: 1,
      totalMeetingMinutes: 90,
      totalRecordingMinutes: 20,
      totalTranslationMinutes: 2,
    });
  });

  it('rejects analytics date ranges over 12 months', async () => {
    const summaries = new InMemorySummaryRepository();
    const useCase = new GetMeetingAnalyticsUseCase(summaries);

    const result = await useCase.execute({
      actor: tenantAdmin,
      tenantId,
      range: { from: '2025-01-01', to: '2026-06-01' },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('12 months');
  });

  it('restricts platform metrics to super admins', async () => {
    const summaries = new InMemorySummaryRepository();
    const useCase = new GetPlatformMetricsUseCase(summaries);

    const allowed = await useCase.execute({ actor: superAdmin, range: range() });
    const denied = await useCase.execute({ actor: tenantAdmin, range: range() });

    expect(allowed.isSuccess).toBe(true);
    expect(denied.isFailure).toBe(true);
  });

  it('exports meeting facts as CSV for tenant admins', async () => {
    const meetingFacts = new InMemoryMeetingFactRepository();
    await meetingFacts.insert(createMeetingFact({ recordingEnabled: true, recordingMinutes: 20 }));
    const useCase = new ExportMeetingReportUseCase(meetingFacts);

    const result = await useCase.execute({ actor: tenantAdmin, tenantId, range: range() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toContain('meetingId,tenantId,hostId');
      expect(result.value).toContain('meeting_analytics');
      expect(result.value).not.toContain('transcript');
    }
  });
});

describe('Phase 09 dashboard performance contract hooks', () => {
  it('keeps query use cases delegated to summary repository reads', async () => {
    const summaries = new InMemorySummaryRepository();
    const spy = vi.spyOn(summaries, 'getMeetingAnalytics');
    const useCase = new GetMeetingAnalyticsUseCase(summaries);

    const result = await useCase.execute({ actor: tenantAdmin, tenantId, range: range() });

    expect(result.isSuccess).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
