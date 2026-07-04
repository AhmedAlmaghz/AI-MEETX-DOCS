import { describe, expect, it } from 'vitest';

import {
  canReadPlatformAnalytics,
  canReadTenantAnalytics,
  ANALYTICS_LIMITS,
  calculateDurationMinutes,
  toUtcDate,
} from './analytics.js';

describe('Analytics permission helpers', () => {
  it('only super_admin can read platform analytics', () => {
    expect(canReadPlatformAnalytics('super_admin')).toBe(true);
    expect(canReadPlatformAnalytics('tenant_owner')).toBe(false);
    expect(canReadPlatformAnalytics('tenant_admin')).toBe(false);
    expect(canReadPlatformAnalytics('tenant_member')).toBe(false);
  });

  it('super_admin, tenant_owner, tenant_admin can read tenant analytics', () => {
    expect(canReadTenantAnalytics('super_admin')).toBe(true);
    expect(canReadTenantAnalytics('tenant_owner')).toBe(true);
    expect(canReadTenantAnalytics('tenant_admin')).toBe(true);
    expect(canReadTenantAnalytics('tenant_member')).toBe(false);
  });
});

describe('Analytics constraints', () => {
  it('caps max range at 366 days (12 months + buffer)', () => {
    expect(ANALYTICS_LIMITS.MAX_RANGE_DAYS).toBe(366);
  });

  it('aggregation interval is exactly 5 minutes per spec', () => {
    expect(ANALYTICS_LIMITS.AGGREGATION_INTERVAL_MS).toBe(5 * 60 * 1000);
  });

  it('targets sub-500ms tenant and sub-2s platform loads', () => {
    expect(ANALYTICS_LIMITS.DASHBOARD_TENANT_TARGET_MS).toBe(500);
    expect(ANALYTICS_LIMITS.DASHBOARD_PLATFORM_TARGET_MS).toBe(2_000);
  });
});

describe('Analytics helpers', () => {
  it('toUtcDate extracts YYYY-MM-DD from ISO timestamp', () => {
    expect(toUtcDate('2026-01-15T10:30:00.000Z' as never)).toBe('2026-01-15');
    expect(toUtcDate('2026-12-31T23:59:59.999Z' as never)).toBe('2026-12-31');
  });

  it('calculateDurationMinutes rounds up partial minutes', () => {
    const start = '2026-01-01T10:00:00.000Z' as never;
    expect(calculateDurationMinutes(start, '2026-01-01T10:00:00.000Z' as never)).toBe(0);
    expect(calculateDurationMinutes(start, '2026-01-01T10:30:00.000Z' as never)).toBe(30);
    expect(calculateDurationMinutes(start, '2026-01-01T11:30:00.000Z' as never)).toBe(90);
    expect(calculateDurationMinutes(start, '2026-01-01T11:00:30.000Z' as never)).toBe(61);
  });
});
