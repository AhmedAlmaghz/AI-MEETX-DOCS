# feature-meeting/scheduling/DATABASE.md

Document ID: SCHEDULING-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Scheduling & Calendar

Subdomain: feature-meeting/scheduling

---

# 1. Tables

---

## scheduled_meetings

Stores the core attributes of scheduled single and recurring meetings.

```sql
CREATE TABLE scheduled_meetings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    title               VARCHAR(256) NOT NULL,
    description         TEXT,
    start_time          TIMESTAMPTZ NOT NULL,            -- Always stored in UTC
    duration_minutes    INTEGER NOT NULL,
    timezone_id         VARCHAR(64) NOT NULL,            -- e.g., 'Asia/Riyadh' or 'America/New_York'
    recurrence_rule     TEXT,                            -- RFC 5545 string
    series_id           UUID,                            -- Groups occurrences in a series
    status              VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_duration CHECK (duration_minutes > 0),
    CONSTRAINT chk_sched_status CHECK (status IN ('SCHEDULED', 'CANCELLED', 'COMPLETED'))
);

COMMENT ON TABLE scheduled_meetings IS
  'Main calendar and scheduled meeting occurrences table.';
```

### Indexes

```sql
CREATE INDEX idx_sched_start_time ON scheduled_meetings(start_time ASC);
CREATE INDEX idx_sched_series ON scheduled_meetings(series_id);
CREATE INDEX idx_sched_meeting ON scheduled_meetings(meeting_id);
```

---

## meeting_reminders

Stores configured offsets for notifications.

```sql
CREATE TABLE meeting_reminders (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id             UUID NOT NULL REFERENCES scheduled_meetings(id) ON DELETE CASCADE,
    trigger_offset_minutes  INTEGER NOT NULL,
    channel                 VARCHAR(20) NOT NULL,            -- 'PUSH' | 'EMAIL' | 'SMS'
    is_triggered            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(schedule_id, trigger_offset_minutes, channel)
);

COMMENT ON TABLE meeting_reminders IS
  'Notification triggers scheduled before a meeting start.';
```

### Indexes

```sql
CREATE INDEX idx_reminders_trigger 
    ON meeting_reminders(schedule_id, is_triggered);
```

---

# 2. Key Queries

## Find reminders to send in next 5 minutes

```sql
SELECT 
    r.id as reminder_id,
    s.id as schedule_id,
    s.title,
    s.meeting_id,
    r.channel
FROM meeting_reminders r
JOIN scheduled_meetings s ON s.id = r.schedule_id
WHERE r.is_triggered = FALSE
  AND s.status = 'SCHEDULED'
  AND s.start_time - (r.trigger_offset_minutes * INTERVAL '1 minute') <= NOW();
```

## Get all occurrences of a series

```sql
SELECT * FROM scheduled_meetings
WHERE series_id = :seriesId
ORDER BY start_time ASC;
```

## Reschedule occurrence

```sql
UPDATE scheduled_meetings
SET start_time = :newStart,
    duration_minutes = :newDuration,
    updated_at = NOW()
WHERE id = :scheduleId;
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `scheduled_meetings` | 12 months after meeting date |
| `meeting_reminders` | Deleted 7 days after trigger |

---

End of Document
