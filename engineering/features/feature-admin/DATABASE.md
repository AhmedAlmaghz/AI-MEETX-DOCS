# feature-admin/DATABASE.md

Document ID: ADMIN-DB-001

Version: 1.0.0

Status: Approved

Feature: Administration & Tenant Management

Module: feature-admin

---

# 1. Tables

---

## tenants

```sql
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(256) NOT NULL,
    domain          VARCHAR(256) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    plan            VARCHAR(64) NOT NULL DEFAULT 'FREE',
    feature_flags   JSONB NOT NULL DEFAULT '{}',
    settings        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tenant_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))
);

COMMENT ON TABLE tenants IS
  'Tenant registry. Each organization is one row. Feature flags and settings stored as JSONB.';
```

### Indexes

```sql
CREATE UNIQUE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_status ON tenants(status);
```

---

## admin_audit_log

Immutable log of all administrative actions.

```sql
CREATE TABLE admin_audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE SET NULL,
    actor_id        UUID NOT NULL,
    actor_role      VARCHAR(20) NOT NULL,
    action_type     VARCHAR(64) NOT NULL,
    target_type     VARCHAR(64) NOT NULL,
    target_id       VARCHAR(256) NOT NULL,
    metadata        JSONB NOT NULL DEFAULT '{}',
    ip_address      VARCHAR(45) NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE admin_audit_log IS
  'Immutable audit trail of all admin actions. No UPDATE or DELETE allowed on this table.';
```

### Indexes

```sql
CREATE INDEX idx_audit_tenant ON admin_audit_log(tenant_id, occurred_at DESC);
CREATE INDEX idx_audit_actor ON admin_audit_log(actor_id, occurred_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action_type);
```

> [!CAUTION]
> A Postgres row-level security policy MUST be applied to prevent any UPDATE or DELETE on this table.

---

## tenant_members

Tracks which users belong to which tenant.

```sql
CREATE TABLE tenant_members (
    tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (tenant_id, user_id),
    CONSTRAINT chk_member_role CHECK (role IN ('TENANT_ADMIN', 'MEMBER'))
);
```

### Indexes

```sql
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
```

---

# 2. Redis Cache (Feature Flags)

```
Key:    feature_flags:{tenantId}
Type:   Redis String (serialized JSON TenantFeatureFlags)
TTL:    60 seconds (refreshed on update)
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `tenants` | Indefinite (soft-delete only) |
| `admin_audit_log` | 7 years (compliance requirement) |
| `tenant_members` | Indefinite |

---

End of Document
