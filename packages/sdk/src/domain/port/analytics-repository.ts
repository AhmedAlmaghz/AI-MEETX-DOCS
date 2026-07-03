import type { MeetingId, Result, UserId } from '@aimeetx/types';

import type {
  AnalyticsDateRange,
  AnalyticsGranularity,
  AnalyticsTenantId,
  MeetingAnalyticsSummary,
  MeetingFact,
  PlatformDailySummary,
  PlatformMetricsSummary,
  TenantDailySummary,
  UserEngagementFact,
} from '../model/analytics.js';

export interface MeetingFactUpdate {
  readonly recordingEnabled?: boolean;
  readonly recordingMinutes?: number;
  readonly aiEnabled?: boolean;
  readonly translationEnabled?: boolean;
  readonly translationMinutesDelta?: number;
}

export interface MeetingFactRepository {
  insert(fact: MeetingFact): Promise<Result<MeetingFact, Error>>;
  getByMeetingId(meetingId: MeetingId): Promise<Result<MeetingFact | null, Error>>;
  update(meetingId: MeetingId, update: MeetingFactUpdate): Promise<Result<MeetingFact, Error>>;
  findByTenantAndDateRange(
    tenantId: AnalyticsTenantId,
    range: AnalyticsDateRange,
  ): Promise<Result<ReadonlyArray<MeetingFact>, Error>>;
  findByDateRange(range: AnalyticsDateRange): Promise<Result<ReadonlyArray<MeetingFact>, Error>>;
}

export interface UserEngagementRepository {
  incrementHosted(input: {
    readonly tenantId: AnalyticsTenantId;
    readonly userId: UserId;
    readonly date: string;
  }): Promise<Result<UserEngagementFact, Error>>;
  incrementAttended(input: {
    readonly tenantId: AnalyticsTenantId;
    readonly userId: UserId;
    readonly date: string;
    readonly meetingMinutes: number;
  }): Promise<Result<UserEngagementFact, Error>>;
  findByTenantAndDateRange(
    tenantId: AnalyticsTenantId,
    range: AnalyticsDateRange,
  ): Promise<Result<ReadonlyArray<UserEngagementFact>, Error>>;
  findActiveUsers(range: AnalyticsDateRange): Promise<Result<ReadonlySet<UserId>, Error>>;
}

export interface AnalyticsSummaryRepository {
  getMeetingAnalytics(input: {
    readonly tenantId: AnalyticsTenantId;
    readonly range: AnalyticsDateRange;
    readonly granularity: AnalyticsGranularity;
  }): Promise<Result<MeetingAnalyticsSummary, Error>>;
  getPlatformMetrics(range: AnalyticsDateRange): Promise<Result<PlatformMetricsSummary, Error>>;
  upsertTenantDailySummary(summary: TenantDailySummary): Promise<Result<void, Error>>;
  upsertPlatformDailySummary(summary: PlatformDailySummary): Promise<Result<void, Error>>;
}
