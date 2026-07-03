import type { Result, UserId } from '@aimeetx/types';

import type {
  AdminActorClaims,
  AdminRole,
  AuditLogEntry,
  Tenant,
  TenantFeatureFlags,
  TenantId,
  TenantMember,
} from '../model/admin.js';

export interface CreateTenantInput {
  readonly name: string;
  readonly slug: string;
  readonly featureFlags?: Partial<TenantFeatureFlags>;
}

export interface InviteTenantMemberInput {
  readonly tenantId: TenantId;
  readonly email: string;
  readonly role: Exclude<AdminRole, 'super_admin'>;
  readonly invitedBy: UserId;
}

export interface AuditLogQuery {
  readonly tenantId?: TenantId;
  readonly actorId?: UserId;
  readonly limit?: number;
}

export interface TenantRepository {
  createTenant(input: CreateTenantInput): Promise<Result<Tenant, Error>>;
  getTenant(tenantId: TenantId): Promise<Result<Tenant | null, Error>>;
  suspendTenant(tenantId: TenantId): Promise<Result<Tenant, Error>>;
  updateFeatureFlags(
    tenantId: TenantId,
    featureFlags: TenantFeatureFlags,
  ): Promise<Result<Tenant, Error>>;
  inviteMember(input: InviteTenantMemberInput): Promise<Result<TenantMember, Error>>;
}

export interface AuditLogRepository {
  append(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<Result<AuditLogEntry, Error>>;
  query(query: AuditLogQuery, actor: AdminActorClaims): Promise<Result<ReadonlyArray<AuditLogEntry>, Error>>;
}

export interface FeatureFlagCache {
  get(tenantId: TenantId): Promise<Result<TenantFeatureFlags | null, Error>>;
  set(tenantId: TenantId, featureFlags: TenantFeatureFlags, ttlMs: number): Promise<Result<void, Error>>;
  delete(tenantId: TenantId): Promise<Result<void, Error>>;
}
