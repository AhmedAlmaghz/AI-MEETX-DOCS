# feature-ai/DATABASE.md

Document ID: AI-DB-001

Version: 1.0.0

Status: Approved

Feature: AI Meeting Assistant

Module: feature-ai

---

# 1. Privacy Policy

> [!IMPORTANT]
> **Privacy-by-Design:** Raw transcript text is NEVER persisted in this module's database.
> Transcript segments are held in memory (Redis) only during the meeting.
> Only the final processed outputs (summaries, action items, reports) are persisted.

---

# 2. Tables

---

## meeting_summaries

Stores rolling and final AI-generated meeting summaries.

```sql
CREATE TABLE meeting_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    summary_text    TEXT NOT NULL,
    key_topics      TEXT[] NOT NULL DEFAULT '{}',
    is_final        BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(meeting_id, is_final) WHERE is_final = TRUE
);

COMMENT ON TABLE meeting_summaries IS
  'Stores AI-generated meeting summaries (incremental and final). Never stores raw transcript.';
```

### Indexes

```sql
CREATE INDEX idx_summaries_meeting ON meeting_summaries(meeting_id);
```

---

## action_items

Stores AI-detected action items from the transcript.

```sql
CREATE TABLE action_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    description     TEXT NOT NULL,
    assigned_to     VARCHAR(256),
    due_date        VARCHAR(64),
    confidence      FLOAT NOT NULL DEFAULT 0.0,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE action_items IS
  'AI-detected action items with assignees and due dates.';
```

### Indexes

```sql
CREATE INDEX idx_action_items_meeting ON action_items(meeting_id);
```

---

## meeting_reports

Stores the final post-meeting AI report.

```sql
CREATE TABLE meeting_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    summary         TEXT NOT NULL,
    decisions       TEXT[] NOT NULL DEFAULT '{}',
    topic_breakdown JSONB NOT NULL DEFAULT '{}',
    status          VARCHAR(20) NOT NULL DEFAULT 'GENERATING',
    generated_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_report_status CHECK (status IN ('GENERATING', 'READY', 'FAILED'))
);

COMMENT ON TABLE meeting_reports IS
  'Final post-meeting AI report. One per meeting. No raw transcript stored.';
```

---

# 3. Redis (Transcript Context Window)

```
Key:    ai_context:{meetingId}
Type:   Redis List (RPUSH / LTRIM to maintain 30-min window)
TTL:    Duration of meeting + 10 minutes
Value:  JSON-serialized TranscriptSegment
```

---

# 4. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_summaries` | 12 months |
| `action_items` | 12 months |
| `meeting_reports` | 24 months |
| Redis AI context | Auto-expire: meeting end + 10 min |

---

End of Document
