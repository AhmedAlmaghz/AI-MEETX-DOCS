# feature-analytics/DATABASE.md

Document ID: ANALYTICS-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Analytics & Insights

Module: feature-analytics

---

# 1. Storage Strategy

Analytics uses a **two-tier storage model**:

- **Tier 1**: Raw fact tables (append-only, high write throughput).
- **Tier 2**: Pre-computed summary tables (updated by aggregation jobs every 5 minutes).

API reads ONLY from Tier 2 summary tables for fast query responses.

---

# 2. Tier 1: Fact Tables

## meeting_facts

```sql
CREATE TABLE meeting_facts (
    meeting_id              UUID PRIMARY KEY,
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    host_id                 UUID NOT NULL,
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

CREATE INDEX idx_meeting_facts_tenant ON meeting_facts(tenant_id, started_at DESC);
CREATE INDEX idx_meeting_facts_date ON meeting_facts(DATE(started_at));
```

---

## user_engagement_facts

```sql
CREATE TABLE user_engagement_facts (
    user_id                 UUID NOT NULL,
    tenant_id               UUID NOT NULL REFERENCES tenants(id),
    fact_date               DATE NOT NULL,
    meetings_hosted         INTEGER NOT NULL DEFAULT 0,
    meetings_attended       INTEGER NOT NULL DEFAULT 0,
    total_meeting_minutes   BIGINT NOT NULL DEFAULT 0,

    PRIMARY KEY (user_id, fact_date)
);

CREATE INDEX idx_user_facts_tenant ON user_engagement_facts(tenant_id, fact_date DESC);
```

---

# 3. Tier 2: Summary Tables

## tenant_daily_summaries

Pre-computed per-tenant daily rollups.

```sql
CREATE TABLE tenant_daily_summaries (
    tenant_id                   UUID NOT NULL REFERENCES tenants(id),
    summary_date                DATE NOT NULL,
    daily_active_users          INTEGER NOT NULL DEFAULT 0,
    total_meetings              INTEGER NOT NULL DEFAULT 0,
    total_meeting_minutes       BIGINT NOT NULL DEFAULT 0,
    total_recording_minutes     BIGINT NOT NULL DEFAULT 0,
    total_translation_minutes   BIGINT NOT NULL DEFAULT 0,
    last_computed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (tenant_id, summary_date)
);
```

## platform_daily_summaries

Platform-wide rollup for super admin dashboard.

```sql
CREATE TABLE platform_daily_summaries (
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
```

---

# 4. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_facts` | 24 months |
| `user_engagement_facts` | 24 months |
| `tenant_daily_summaries` | 36 months |
| `platform_daily_summaries` | 36 months |

---

End of Document
