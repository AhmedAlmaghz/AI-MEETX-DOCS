# Administration & Tenant Management Module

## Overview

`feature-admin` is the multi-tenant administration backbone of the AI MEETX platform. It manages the full tenant lifecycle, per-tenant feature flag configuration, user organization management, and maintains a tamper-proof audit log of all administrative actions.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business requirements for multi-tenancy, user management, and feature policies.
2. [Specification](SPECIFICATION.md) - Domain models for Tenant, TenantFeatureFlags, and AuditLogEntry.
3. [Database Schema](DATABASE.md) - Tenants, audit log (immutable), tenant members, and Redis flag cache.
4. [API Contract](API.md) - Super-admin and tenant-admin endpoints with strict role enforcement.
5. [Domain Events](EVENTS.md) - TenantCreated, Suspended, and FeatureFlagsUpdated events with side effects.
6. [Test Plan](TESTS.md) - Unit, integration, and security test coverage.

## Key Features

- **Multi-Tenancy**: Full tenant isolation with per-tenant settings and feature flags.
- **Feature Flag System**: Redis-cached feature flags with < 5ms evaluation latency, enforced at runtime.
- **Immutable Audit Log**: 7-year compliance-grade log with Postgres RLS preventing modification.
- **Tenant Suspension**: Cascading suspension — force-ends active meetings and revokes all JWT sessions.
- **Role Hierarchy**: SUPER_ADMIN (platform-wide) and TENANT_ADMIN (own organization) with strict API guards.
