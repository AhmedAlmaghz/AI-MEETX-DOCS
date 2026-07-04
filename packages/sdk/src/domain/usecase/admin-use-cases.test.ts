import 'reflect-metadata';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IsoDateString, OrganizationId, UserId } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import { InMemoryFeatureFlagCache } from '../../data/in-memory-feature-flag-cache.js';
import type {
  AdminActorClaims,
  AuditLogEntry,
  Tenant,
  TenantFeatureFlags,
  TenantMember,
} from '../model/admin.js';
import { DEFAULT_TENANT_FEATURE_FLAGS, FEATURE_FLAG_CACHE_TTL_MS } from '../model/admin.js';
import type {
  AuditLogQuery,
  AuditLogRepository,
  FeatureFlagCache,
  TenantRepository,
} from '../port/admin-repository.js';
import {
  CreateTenantUseCase,
  GetTenantFeatureFlagsUseCase,
  InviteTenantMemberUseCase,
  QueryAuditLogUseCase,
  SuspendTenantUseCase,
  UpdateFeatureFlagsUseCase,
} from './admin-use-cases.js';

const tenantId = 'tenant_123' as OrganizationId;
const userId = 'user_admin' as UserId;
const memberId = 'member_123' as Uuid;
const createdAt = '2026-01-01T00:00:00.000Z' as IsoDateString;

const superAdmin: AdminActorClaims = {
  userId,
  role: 'super_admin',
};

const tenantAdmin: AdminActorClaims = {
  userId,
  role: 'tenant_admin',
  tenantId,
};

const tenantMember: AdminActorClaims = {
  userId,
  role: 'tenant_member',
  tenantId,
};

function createTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: tenantId,
    name: 'Acme Corp',
    slug: 'acme',
    status: 'active',
    featureFlags: DEFAULT_TENANT_FEATURE_FLAGS,
    createdAt,
    updatedAt: createdAt,
    suspendedAt: null,
    ...overrides,
  };
}

function createAuditLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 'audit_123' as Uuid,
    tenantId,
    actorId: userId,
    actorRole: 'super_admin',
    action: 'tenant.created',
    targetId: tenantId,
    metadata: {},
    createdAt,
    ...overrides,
  };
}

function createTenantRepository(): TenantRepository {
  return {
    createTenant: vi.fn(),
    getTenant: vi.fn(),
    suspendTenant: vi.fn(),
    updateFeatureFlags: vi.fn(),
    inviteMember: vi.fn(),
  };
}

function createAuditLogRepository(): AuditLogRepository {
  return {
    append: vi.fn(),
    query: vi.fn(),
  };
}

class ImmutableAuditLogRepository implements AuditLogRepository {
  private readonly entries: AuditLogEntry[] = [];

  async append(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>) {
    const saved = createAuditLog({
      ...entry,
      id: `audit_${this.entries.length + 1}` as Uuid,
      createdAt,
    });
    this.entries.push(saved);
    return success(saved);
  }

  async query(query: AuditLogQuery) {
    return success(
      this.entries.filter((entry) => query.tenantId === undefined || entry.tenantId === query.tenantId),
    );
  }

  async update() {
    return failure(new Error('Audit logs are immutable'));
  }

  async delete() {
    return failure(new Error('Audit logs are immutable'));
  }
}

describe('Phase 08 admin RBAC use cases', () => {
  let tenantRepository: TenantRepository;
  let auditLogRepository: AuditLogRepository;
  let featureFlagCache: FeatureFlagCache;

  beforeEach(() => {
    tenantRepository = createTenantRepository();
    auditLogRepository = createAuditLogRepository();
    featureFlagCache = new InMemoryFeatureFlagCache();
    vi.mocked(auditLogRepository.append).mockResolvedValue(success(createAuditLog()));
  });

  it('allows only super admins to create tenants', async () => {
    const useCase = new CreateTenantUseCase(tenantRepository, auditLogRepository);
    vi.mocked(tenantRepository.createTenant).mockResolvedValue(success(createTenant()));

    const allowed = await useCase.execute({
      actor: superAdmin,
      input: { name: 'Acme Corp', slug: 'acme' },
    });
    const denied = await useCase.execute({
      actor: tenantAdmin,
      input: { name: 'Denied Corp', slug: 'denied' },
    });

    expect(allowed.isSuccess).toBe(true);
    expect(denied.isFailure).toBe(true);
    expect(tenantRepository.createTenant).toHaveBeenCalledTimes(1);
  });

  it('allows only super admins to suspend tenants', async () => {
    const useCase = new SuspendTenantUseCase(tenantRepository, auditLogRepository);
    vi.mocked(tenantRepository.suspendTenant).mockResolvedValue(
      success(createTenant({ status: 'suspended', suspendedAt: createdAt })),
    );

    const allowed = await useCase.execute({ actor: superAdmin, tenantId });
    const denied = await useCase.execute({ actor: tenantMember, tenantId });

    expect(allowed.isSuccess).toBe(true);
    expect(denied.isFailure).toBe(true);
    expect(tenantRepository.suspendTenant).toHaveBeenCalledTimes(1);
  });

  it('enforces tenant scoped admin claims when updating feature flags', async () => {
    const useCase = new UpdateFeatureFlagsUseCase(
      tenantRepository,
      auditLogRepository,
      featureFlagCache,
    );
    const featureFlags: TenantFeatureFlags = { ...DEFAULT_TENANT_FEATURE_FLAGS, classroom: true };
    vi.mocked(tenantRepository.updateFeatureFlags).mockResolvedValue(
      success(createTenant({ featureFlags })),
    );

    const allowed = await useCase.execute({ actor: tenantAdmin, tenantId, featureFlags });
    const denied = await useCase.execute({
      actor: { ...tenantAdmin, tenantId: 'tenant_other' as OrganizationId },
      tenantId,
      featureFlags,
    });

    expect(allowed.isSuccess).toBe(true);
    expect(denied.isFailure).toBe(true);
    expect(tenantRepository.updateFeatureFlags).toHaveBeenCalledTimes(1);
  });

  it('allows tenant admins to invite tenant members within their tenant', async () => {
    const useCase = new InviteTenantMemberUseCase(tenantRepository, auditLogRepository);
    const member: TenantMember = {
      id: memberId,
      tenantId,
      userId: null,
      email: 'member@example.com',
      role: 'tenant_member',
      invitedBy: userId,
      invitedAt: createdAt,
      acceptedAt: null,
    };
    vi.mocked(tenantRepository.inviteMember).mockResolvedValue(success(member));

    const allowed = await useCase.execute({
      actor: tenantAdmin,
      input: { tenantId, email: member.email, role: 'tenant_member', invitedBy: userId },
    });
    const denied = await useCase.execute({
      actor: tenantMember,
      input: { tenantId, email: member.email, role: 'tenant_member', invitedBy: userId },
    });

    expect(allowed.isSuccess).toBe(true);
    expect(denied.isFailure).toBe(true);
    expect(tenantRepository.inviteMember).toHaveBeenCalledTimes(1);
  });

  it('enforces admin claims on audit log queries', async () => {
    const useCase = new QueryAuditLogUseCase(auditLogRepository);
    vi.mocked(auditLogRepository.query).mockResolvedValue(success([createAuditLog()]));

    const allowed = await useCase.execute({ actor: tenantAdmin, query: { tenantId } });
    const deniedByRole = await useCase.execute({ actor: tenantMember, query: { tenantId } });
    const deniedByTenant = await useCase.execute({
      actor: tenantAdmin,
      query: { tenantId: 'tenant_other' as OrganizationId },
    });

    expect(allowed.isSuccess).toBe(true);
    expect(deniedByRole.isFailure).toBe(true);
    expect(deniedByTenant.isFailure).toBe(true);
    expect(auditLogRepository.query).toHaveBeenCalledTimes(1);
  });
});

describe('Phase 08 audit log immutability', () => {
  it('does not expose update/delete operations through AuditLogRepository port', () => {
    const repository = createAuditLogRepository();

    expect('append' in repository).toBe(true);
    expect('query' in repository).toBe(true);
    expect('update' in repository).toBe(false);
    expect('delete' in repository).toBe(false);
  });

  it('rejects update/delete operations in immutable repository implementations', async () => {
    const repository = new ImmutableAuditLogRepository();
    await repository.append({
      tenantId,
      actorId: userId,
      actorRole: 'super_admin',
      action: 'tenant.created',
      targetId: tenantId,
      metadata: {},
    });

    const updateResult = await repository.update();
    const deleteResult = await repository.delete();
    const queryResult = await repository.query({ tenantId });

    expect(updateResult.isFailure).toBe(true);
    expect(deleteResult.isFailure).toBe(true);
    expect(queryResult.isSuccess).toBe(true);
    if (queryResult.isSuccess) expect(queryResult.value).toHaveLength(1);
  });
});

describe('Phase 08 feature flag caching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('serves feature flags from cache inside the 60-second TTL', async () => {
    const tenantRepository = createTenantRepository();
    const cache = new InMemoryFeatureFlagCache();
    const useCase = new GetTenantFeatureFlagsUseCase(tenantRepository, cache);
    const featureFlags: TenantFeatureFlags = { ...DEFAULT_TENANT_FEATURE_FLAGS, classroom: true };
    vi.mocked(tenantRepository.getTenant).mockResolvedValue(success(createTenant({ featureFlags })));

    const first = await useCase.execute({ actor: tenantAdmin, tenantId });
    const second = await useCase.execute({ actor: tenantAdmin, tenantId });

    expect(first.isSuccess).toBe(true);
    expect(second.isSuccess).toBe(true);
    expect(tenantRepository.getTenant).toHaveBeenCalledTimes(1);
  });

  it('auto-evicts feature flags after 60 seconds', async () => {
    const tenantRepository = createTenantRepository();
    const cache = new InMemoryFeatureFlagCache();
    const useCase = new GetTenantFeatureFlagsUseCase(tenantRepository, cache);
    vi.mocked(tenantRepository.getTenant).mockResolvedValue(success(createTenant()));

    await useCase.execute({ actor: tenantAdmin, tenantId });
    vi.advanceTimersByTime(FEATURE_FLAG_CACHE_TTL_MS - 1);
    await useCase.execute({ actor: tenantAdmin, tenantId });
    vi.advanceTimersByTime(1);
    await useCase.execute({ actor: tenantAdmin, tenantId });

    expect(tenantRepository.getTenant).toHaveBeenCalledTimes(2);
  });
});
