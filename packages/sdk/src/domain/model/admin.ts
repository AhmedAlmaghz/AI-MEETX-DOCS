import type { IsoDateString, OrganizationId, UserId, Uuid } from '@aimeetx/types';

export type TenantId = OrganizationId;

export type TenantStatus = 'active' | 'suspended';

export type AdminRole = 'super_admin' | 'tenant_owner' | 'tenant_admin' | 'tenant_member';

export type AuditLogAction =
  | 'tenant.created'
  | 'tenant.suspended'
  | 'feature_flags.updated'
  | 'audit_log.queried'
  | 'tenant_member.invited';

export interface TenantFeatureFlags {
  readonly recording: boolean;
  readonly translation: boolean;
  readonly aiSummaries: boolean;
  readonly classroom: boolean;
  readonly whiteboard: boolean;
}

export interface Tenant {
  readonly id: TenantId;
  readonly name: string;
  readonly slug: string;
  readonly status: TenantStatus;
  readonly featureFlags: TenantFeatureFlags;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
  readonly suspendedAt: IsoDateString | null;
}

export interface TenantMember {
  readonly id: Uuid;
  readonly tenantId: TenantId;
  readonly userId: UserId | null;
  readonly email: string;
  readonly role: AdminRole;
  readonly invitedBy: UserId;
  readonly invitedAt: IsoDateString;
  readonly acceptedAt: IsoDateString | null;
}

export interface AuditLogEntry {
  readonly id: Uuid;
  readonly tenantId: TenantId | null;
  readonly actorId: UserId;
  readonly actorRole: AdminRole;
  readonly action: AuditLogAction;
  readonly targetId: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly createdAt: IsoDateString;
}

export interface AdminActorClaims {
  readonly userId: UserId;
  readonly role: AdminRole;
  readonly tenantId?: TenantId;
}

export const DEFAULT_TENANT_FEATURE_FLAGS: TenantFeatureFlags = {
  recording: true,
  translation: true,
  aiSummaries: true,
  classroom: false,
  whiteboard: true,
} as const;

export const FEATURE_FLAG_CACHE_TTL_MS = 60_000;

export function canManageTenants(role: AdminRole): boolean {
  return role === 'super_admin';
}

export function canManageTenantSettings(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'tenant_owner' || role === 'tenant_admin';
}

export function canInviteTenantMembers(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'tenant_owner' || role === 'tenant_admin';
}

export function canQueryAuditLogs(role: AdminRole): boolean {
  return role === 'super_admin' || role === 'tenant_owner' || role === 'tenant_admin';
}
