import type { Result } from '@aimeetx/types';
import { success } from '@aimeetx/types';

import type { TenantFeatureFlags, TenantId } from '../domain/model/admin.js';
import type { FeatureFlagCache } from '../domain/port/admin-repository.js';

interface CacheEntry {
  readonly value: TenantFeatureFlags;
  readonly expiresAt: number;
}

export class InMemoryFeatureFlagCache implements FeatureFlagCache {
  private readonly entries = new Map<TenantId, CacheEntry>();

  async get(tenantId: TenantId): Promise<Result<TenantFeatureFlags | null, Error>> {
    const entry = this.entries.get(tenantId);
    if (!entry) return success(null);

    if (Date.now() >= entry.expiresAt) {
      this.entries.delete(tenantId);
      return success(null);
    }

    return success(entry.value);
  }

  async set(tenantId: TenantId, featureFlags: TenantFeatureFlags, ttlMs: number): Promise<Result<void, Error>> {
    this.entries.set(tenantId, {
      value: featureFlags,
      expiresAt: Date.now() + ttlMs,
    });
    return success(undefined);
  }

  async delete(tenantId: TenantId): Promise<Result<void, Error>> {
    this.entries.delete(tenantId);
    return success(undefined);
  }
}
