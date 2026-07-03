-- V3__analytics_tables.sql
-- Phase 09: Analytics — fact tables and summary tables
-- Two-tier storage: raw facts (append-only) + pre-computed summaries

CREATE TABLE IF NOT EXISTS meeting_facts (
    meeting_id              UUID PRIMARY KEY,
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    host_id                 UUID NOT NULL REFERENCES users(id),
    started_at              TIMESTAMPTZ NOT NULL,
    ended_at                TIMESTAMPTZ NOT NULL,
    duration_minutes        BIGINT NOT NULL,
    peak_participants       INTEGER NOT NULL DEFAULT 0,
    total_participants      INTEGER NOT NULL DEFAULT 0,
    recording_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
    recording_minutes       BIGINT NOT NULL DEFAULT 0,
    ai_enabled              BOOLEAN NOT NULL DEFAULT FALSE,
    translation_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    translation_minutes     BIGINT NOT NULL DEFAULT 0,
    classroom_mode          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_engagement_facts (
    user_id                 UUID NOT NULL REFERENCES users(id),
    tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    fact_date               DATE NOT NULL,
    meetings_hosted         INTEGER NOT NULL DEFAULT 0,
    meetings_attended       INTEGER NOT NULL DEFAULT 0,
    total_meeting_minutes   BIGINT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, fact_date)
);

CREATE TABLE IF NOT EXISTS tenant_daily_summaries (
    tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    summary_date                DATE NOT NULL,
    daily_active_users          INTEGER NOT NULL DEFAULT 0,
    total_meetings              INTEGER NOT NULL DEFAULT 0,
    total_meeting_minutes       BIGINT NOT NULL DEFAULT 0,
    total_recording_minutes     BIGINT NOT NULL DEFAULT 0,
    total_translation_minutes   BIGINT NOT NULL DEFAULT 0,
    last_computed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, summary_date)
);

CREATE TABLE IF NOT EXISTS platform_daily_summaries (
    summary_date                DATE PRIMARY KEY,
    daily_active_users          INTEGER NOT NULL DEFAULT 0,
    monthly_active_users        INTEGER NOT NULL DEFAULT 0,
    total_tenants               INTEGER NOT NULL DEFAULT 0,
    total_meetings              INTEGER NOT NULL DEFAULT 0,
    total_meeting_minutes       BIGINT NOT NULL DEFAULT 0,
    total_recording_minutes     BIGINT NOT NULL DEFAULT 0,
    total_translation_minutes   BIGINT NOT NULL DEFAULT 0,
    last_computed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_facts_tenant ON meeting_facts(tenant_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_meeting_facts_date ON meeting_facts(DATE(started_at));
CREATE INDEX IF NOT EXISTS idx_user_facts_tenant ON user_engagement_facts(tenant_id, fact_date DESC);