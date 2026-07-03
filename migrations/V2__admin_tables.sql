-- V2__admin_tables.sql
-- Phase 08: Administration — tenants, tenant members, feature flags

CREATE TABLE IF NOT EXISTS tenants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(256) NOT NULL,
    slug            VARCHAR(128) UNIQUE NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    feature_flags   JSONB NOT NULL DEFAULT '{"recording": true, "translation": true, "aiSummaries": true, "classroom": false, "whiteboard": true}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suspended_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS tenant_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES users(id),
    email           VARCHAR(320) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'tenant_member',
    invited_by       UUID NOT NULL REFERENCES users(id),
    invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    accepted_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES tenants(id) ON DELETE NO ACTION,
    actor_id         UUID NOT NULL REFERENCES users(id),
    actor_role      VARCHAR(20) NOT NULL,
    action          VARCHAR(64) NOT NULL,
    target_id        VARCHAR(256) NOT NULL,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Audit logs are immutable (no updates, no deletes)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_select ON admin_audit_logs
    FOR SELECT TO app_role;

-- Block any UPDATE or DELETE at the database level via RLS
CREATE POLICY audit_log_no_update ON admin_audit_logs
    FOR UPDATE TO app_role
    USING (false)
    WITH CHECK (false);

CREATE POLICY audit_log_no_delete ON admin_audit_logs
    FOR DELETE TO app_role
    USING (false);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date ON admin_audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON admin_audit_logs(actor_id, created_at DESC);