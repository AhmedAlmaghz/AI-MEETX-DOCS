import { inject, injectable } from 'tsyringe';

import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  AdminActorClaims,
  AuditLogEntry,
  Tenant,
  TenantFeatureFlags,
  TenantId,
  TenantMember,
} from '../model/admin.js';
import {
  DEFAULT_TENANT_FEATURE_FLAGS,
  FEATURE_FLAG_CACHE_TTL_MS,
  canInviteTenantMembers,
  canManageTenantSettings,
  canManageTenants,
  canQueryAuditLogs,
} from '../model/admin.js';
import type {
  AuditLogQuery,
  AuditLogRepository,
  CreateTenantInput,
  FeatureFlagCache,
  InviteTenantMemberInput,
  TenantRepository,
} from '../port/admin-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

function assertSuperAdmin(actor: AdminActorClaims): Error | null {
  return canManageTenants(actor.role) ? null : new Error('Super admin role required');
}

function assertTenantAccess(actor: AdminActorClaims, tenantId: TenantId): Error | null {
  if (actor.role === 'super_admin') return null;
  if (actor.tenantId === tenantId) return null;
  return new Error('Tenant access denied');
}

function mergeFeatureFlags(update?: Partial<TenantFeatureFlags>): TenantFeatureFlags {
  return {
    ...DEFAULT_TENANT_FEATURE_FLAGS,
    ...update,
  };
}

async function appendAuditLog(
  auditLogRepository: AuditLogRepository,
  actor: AdminActorClaims,
  entry: Omit<AuditLogEntry, 'id' | 'createdAt' | 'actorId' | 'actorRole'>,
): Promise<Result<void, Error>> {
  const result = await auditLogRepository.append({
    ...entry,
    actorId: actor.userId,
    actorRole: actor.role,
  });
  if (result.isFailure) return failure(result.error);
  return success(undefined);
}

export interface CreateTenantCommand {
  readonly actor: AdminActorClaims;
  readonly input: CreateTenantInput;
}

@injectable()
export class CreateTenantUseCase implements UseCase<CreateTenantCommand, Tenant, Error> {
  constructor(
    @inject(TOKENS.TenantRepository)
    private readonly tenantRepository: TenantRepository,
    @inject(TOKENS.AuditLogRepository)
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(command: CreateTenantCommand): Promise<Result<Tenant, Error>> {
    const roleError = assertSuperAdmin(command.actor);
    if (roleError) return failure(roleError);

    const result = await this.tenantRepository.createTenant({
      ...command.input,
      featureFlags: mergeFeatureFlags(command.input.featureFlags),
    });
    if (result.isFailure) return failure(result.error);

    const auditResult = await appendAuditLog(this.auditLogRepository, command.actor, {
      tenantId: result.value.id,
      action: 'tenant.created',
      targetId: result.value.id,
      metadata: { slug: result.value.slug },
    });
    if (auditResult.isFailure) return failure(auditResult.error);

    return success(result.value);
  }
}

export interface SuspendTenantCommand {
  readonly actor: AdminActorClaims;
  readonly tenantId: TenantId;
}

@injectable()
export class SuspendTenantUseCase implements UseCase<SuspendTenantCommand, Tenant, Error> {
  constructor(
    @inject(TOKENS.TenantRepository)
    private readonly tenantRepository: TenantRepository,
    @inject(TOKENS.AuditLogRepository)
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(command: SuspendTenantCommand): Promise<Result<Tenant, Error>> {
    const roleError = assertSuperAdmin(command.actor);
    if (roleError) return failure(roleError);

    const result = await this.tenantRepository.suspendTenant(command.tenantId);
    if (result.isFailure) return failure(result.error);

    const auditResult = await appendAuditLog(this.auditLogRepository, command.actor, {
      tenantId: command.tenantId,
      action: 'tenant.suspended',
      targetId: command.tenantId,
      metadata: {},
    });
    if (auditResult.isFailure) return failure(auditResult.error);

    return success(result.value);
  }
}

export interface UpdateFeatureFlagsCommand {
  readonly actor: AdminActorClaims;
  readonly tenantId: TenantId;
  readonly featureFlags: TenantFeatureFlags;
}

@injectable()
export class UpdateFeatureFlagsUseCase implements UseCase<UpdateFeatureFlagsCommand, Tenant, Error> {
  constructor(
    @inject(TOKENS.TenantRepository)
    private readonly tenantRepository: TenantRepository,
    @inject(TOKENS.AuditLogRepository)
    private readonly auditLogRepository: AuditLogRepository,
    @inject(TOKENS.FeatureFlagCache)
    private readonly featureFlagCache: FeatureFlagCache,
  ) {}

  async execute(command: UpdateFeatureFlagsCommand): Promise<Result<Tenant, Error>> {
    if (!canManageTenantSettings(command.actor.role)) {
      return failure(new Error('Tenant admin role required'));
    }

    const accessError = assertTenantAccess(command.actor, command.tenantId);
    if (accessError) return failure(accessError);

    const result = await this.tenantRepository.updateFeatureFlags(command.tenantId, command.featureFlags);
    if (result.isFailure) return failure(result.error);

    const cacheResult = await this.featureFlagCache.set(
      command.tenantId,
      command.featureFlags,
      FEATURE_FLAG_CACHE_TTL_MS,
    );
    if (cacheResult.isFailure) return failure(cacheResult.error);

    const auditResult = await appendAuditLog(this.auditLogRepository, command.actor, {
      tenantId: command.tenantId,
      action: 'feature_flags.updated',
      targetId: command.tenantId,
      metadata: { featureFlags: command.featureFlags },
    });
    if (auditResult.isFailure) return failure(auditResult.error);

    return success(result.value);
  }
}

export interface GetTenantFeatureFlagsCommand {
  readonly actor: AdminActorClaims;
  readonly tenantId: TenantId;
}

@injectable()
export class GetTenantFeatureFlagsUseCase
  implements UseCase<GetTenantFeatureFlagsCommand, TenantFeatureFlags, Error>
{
  constructor(
    @inject(TOKENS.TenantRepository)
    private readonly tenantRepository: TenantRepository,
    @inject(TOKENS.FeatureFlagCache)
    private readonly featureFlagCache: FeatureFlagCache,
  ) {}

  async execute(command: GetTenantFeatureFlagsCommand): Promise<Result<TenantFeatureFlags, Error>> {
    const accessError = assertTenantAccess(command.actor, command.tenantId);
    if (accessError) return failure(accessError);

    const cachedResult = await this.featureFlagCache.get(command.tenantId);
    if (cachedResult.isFailure) return failure(cachedResult.error);
    if (cachedResult.value) return success(cachedResult.value);

    const tenantResult = await this.tenantRepository.getTenant(command.tenantId);
    if (tenantResult.isFailure) return failure(tenantResult.error);
    if (!tenantResult.value) return failure(new Error('Tenant not found'));

    const cacheResult = await this.featureFlagCache.set(
      command.tenantId,
      tenantResult.value.featureFlags,
      FEATURE_FLAG_CACHE_TTL_MS,
    );
    if (cacheResult.isFailure) return failure(cacheResult.error);

    return success(tenantResult.value.featureFlags);
  }
}

export interface QueryAuditLogCommand {
  readonly actor: AdminActorClaims;
  readonly query: AuditLogQuery;
}

@injectable()
export class QueryAuditLogUseCase
  implements UseCase<QueryAuditLogCommand, ReadonlyArray<AuditLogEntry>, Error>
{
  constructor(
    @inject(TOKENS.AuditLogRepository)
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(command: QueryAuditLogCommand): Promise<Result<ReadonlyArray<AuditLogEntry>, Error>> {
    if (!canQueryAuditLogs(command.actor.role)) {
      return failure(new Error('Audit log access denied'));
    }

    if (command.query.tenantId) {
      const accessError = assertTenantAccess(command.actor, command.query.tenantId);
      if (accessError) return failure(accessError);
    }

    return this.auditLogRepository.query(command.query, command.actor);
  }
}

export interface InviteTenantMemberCommand {
  readonly actor: AdminActorClaims;
  readonly input: InviteTenantMemberInput;
}

@injectable()
export class InviteTenantMemberUseCase implements UseCase<InviteTenantMemberCommand, TenantMember, Error> {
  constructor(
    @inject(TOKENS.TenantRepository)
    private readonly tenantRepository: TenantRepository,
    @inject(TOKENS.AuditLogRepository)
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  async execute(command: InviteTenantMemberCommand): Promise<Result<TenantMember, Error>> {
    if (!canInviteTenantMembers(command.actor.role)) {
      return failure(new Error('Tenant admin role required'));
    }

    const accessError = assertTenantAccess(command.actor, command.input.tenantId);
    if (accessError) return failure(accessError);

    const result = await this.tenantRepository.inviteMember(command.input);
    if (result.isFailure) return failure(result.error);

    const auditResult = await appendAuditLog(this.auditLogRepository, command.actor, {
      tenantId: command.input.tenantId,
      action: 'tenant_member.invited',
      targetId: result.value.id,
      metadata: { email: command.input.email, role: command.input.role },
    });
    if (auditResult.isFailure) return failure(auditResult.error);

    return success(result.value);
  }
}
