import { describe, expect, it } from 'vitest';

import {
  canManageTenants,
  canManageTenantSettings,
  canInviteTenantMembers,
  canQueryAuditLogs,
  DEFAULT_TENANT_FEATURE_FLAGS,
  FEATURE_FLAG_CACHE_TTL_MS,
} from './admin.js';

describe('Admin permission helpers', () => {
  it('only super_admin can manage tenants', () => {
    expect(canManageTenants('super_admin')).toBe(true);
    expect(canManageTenants('tenant_owner')).toBe(false);
    expect(canManageTenants('tenant_admin')).toBe(false);
    expect(canManageTenants('tenant_member')).toBe(false);
  });

  it('tenant_admin and tenant_owner can manage settings', () => {
    expect(canManageTenantSettings('super_admin')).toBe(true);
    expect(canManageTenantSettings('tenant_owner')).toBe(true);
    expect(canManageTenantSettings('tenant_admin')).toBe(true);
    expect(canManageTenantSettings('tenant_member')).toBe(false);
  });

  it('tenant_admin and tenant_owner can invite members', () => {
    expect(canInviteTenantMembers('super_admin')).toBe(true);
    expect(canInviteTenantMembers('tenant_owner')).toBe(true);
    expect(canInviteTenantMembers('tenant_admin')).toBe(true);
    expect(canInviteTenantMembers('tenant_member')).toBe(false);
  });

  it('only super_admin and tenant owners can query audit logs', () => {
    expect(canQueryAuditLogs('super_admin')).toBe(true);
    expect(canQueryAuditLogs('tenant_owner')).toBe(true);
    expect(canQueryAuditLogs('tenant_admin')).toBe(true);
    expect(canQueryAuditLogs('tenant_member')).toBe(false);
  });
});

describe('Admin defaults and constants', () => {
  it('enables recording/translation/aiSummaries/whiteboard by default', () => {
    expect(DEFAULT_TENANT_FEATURE_FLAGS.recording).toBe(true);
    expect(DEFAULT_TENANT_FEATURE_FLAGS.translation).toBe(true);
    expect(DEFAULT_TENANT_FEATURE_FLAGS.aiSummaries).toBe(true);
    expect(DEFAULT_TENANT_FEATURE_FLAGS.whiteboard).toBe(true);
  });

  it('disables classroom by default (opt-in)', () => {
    expect(DEFAULT_TENANT_FEATURE_FLAGS.classroom).toBe(false);
  });

  it('feature flag cache TTL is exactly 60 seconds per spec', () => {
    expect(FEATURE_FLAG_CACHE_TTL_MS).toBe(60_000);
  });
});
