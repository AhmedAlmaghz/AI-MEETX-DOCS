import type { IsoDateString, MeetingId, OrganizationId, UserId } from '@aimeetx/types';

import type { TenantId } from './admin.js';

export type AnalyticsTenantId = TenantId | OrganizationId;

export type AnalyticsGranularity = 'daily' | 'weekly' | 'monthly';

export interface AnalyticsDateRange {
  readonly from: string;
  readonly to: string;
}

export interface MeetingFact {
  readonly meetingId: MeetingId;
  readonly tenantId: AnalyticsTenantId;
  readonly hostId: UserId;
  readonly startedAt: IsoDateString;
  readonly endedAt: IsoDateString;
  readonly durationMinutes: number;
  readonly peakParticipants: number;
  readonly totalParticipants: number;
  readonly recordingEnabled: boolean;
  readonly recordingMinutes: number;
  readonly aiEnabled: boolean;
  readonly translationEnabled: boolean;
  readonly translationMinutes: number;
  readonly classroomMode: boolean;
}

export interface UserEngagementFact {
  readonly userId: UserId;
  readonly tenantId: AnalyticsTenantId;
  readonly date: string;
  readonly meetingsHosted: number;
  readonly meetingsAttended: number;
  readonly totalMeetingMinutes: number;
}

export interface TenantDailySummary {
  readonly tenantId: AnalyticsTenantId;
  readonly date: string;
  readonly dailyActiveUsers: number;
  readonly totalMeetings: number;
  readonly totalMeetingMinutes: number;
  readonly totalRecordingMinutes: number;
  readonly totalTranslationMinutes: number;
  readonly lastComputedAt: IsoDateString;
}

export interface PlatformDailySummary {
  readonly date: string;
  readonly dailyActiveUsers: number;
  readonly monthlyActiveUsers: number;
  readonly totalTenants: number;
  readonly totalMeetings: number;
  readonly totalMeetingMinutes: number;
  readonly totalRecordingMinutes: number;
  readonly totalTranslationMinutes: number;
  readonly lastComputedAt: IsoDateString;
}

export interface MeetingAnalyticsPoint {
  readonly date: string;
  readonly totalMeetings: number;
  readonly totalMeetingMinutes: number;
  readonly avgParticipantsPerMeeting: number;
}

export interface MeetingAnalyticsSummary {
  readonly tenantId: AnalyticsTenantId;
  readonly granularity: AnalyticsGranularity;
  readonly from: string;
  readonly to: string;
  readonly series: ReadonlyArray<MeetingAnalyticsPoint>;
}

export interface PlatformMetricsSummary {
  readonly from: string;
  readonly to: string;
  readonly dailyActiveUsers: number;
  readonly monthlyActiveUsers: number;
  readonly totalMeetings: number;
  readonly totalMeetingMinutes: number;
  readonly totalRecordingMinutes: number;
  readonly totalTranslationMinutes: number;
}

export interface AnalyticsActorClaims {
  readonly userId: UserId;
  readonly role: 'super_admin' | 'tenant_owner' | 'tenant_admin' | 'tenant_member';
  readonly tenantId?: AnalyticsTenantId;
}

export interface MeetingEndedAnalyticsPayload {
  readonly meetingId: MeetingId;
  readonly tenantId: AnalyticsTenantId;
  readonly hostId: UserId;
  readonly startedAt: IsoDateString;
  readonly endedAt: IsoDateString;
  readonly peakParticipants: number;
  readonly totalParticipants: number;
  readonly recordingEnabled?: boolean;
  readonly aiEnabled?: boolean;
  readonly translationEnabled?: boolean;
  readonly classroomMode?: boolean;
}

export interface RecordingReadyAnalyticsPayload {
  readonly meetingId: MeetingId;
  readonly recordingMinutes: number;
}

export interface TranslationAnalyticsPayload {
  readonly meetingId: MeetingId;
  readonly durationMs: number;
}

export const ANALYTICS_LIMITS = {
  MAX_RANGE_DAYS: 366,
  AGGREGATION_INTERVAL_MS: 5 * 60 * 1000,
  DASHBOARD_TENANT_TARGET_MS: 500,
  DASHBOARD_PLATFORM_TARGET_MS: 2_000,
} as const;

export function canReadTenantAnalytics(role: AnalyticsActorClaims['role']): boolean {
  return role === 'super_admin' || role === 'tenant_owner' || role === 'tenant_admin';
}

export function canReadPlatformAnalytics(role: AnalyticsActorClaims['role']): boolean {
  return role === 'super_admin';
}

export function toUtcDate(isoDate: IsoDateString): string {
  return isoDate.slice(0, 10);
}

export function calculateDurationMinutes(startedAt: IsoDateString, endedAt: IsoDateString): number {
  const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  return Math.max(0, Math.ceil(durationMs / 60_000));
}
