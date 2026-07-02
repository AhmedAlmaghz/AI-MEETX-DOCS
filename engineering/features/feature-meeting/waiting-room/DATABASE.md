# feature-meeting/waiting-room/DATABASE.md

Document ID: WAITING-ROOM-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Waiting Room / Lobby Management

Subdomain: feature-meeting/waiting-room

---

# 1. Tables

---

## waiting_room_entries

Tracks each participant's hold and admission logs.

```sql
CREATE TABLE waiting_room_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    resolution          VARCHAR(20) NOT NULL DEFAULT 'WAITING', -- 'WAITING' | 'ADMITTED' | 'DENIED'
    resolved_by         UUID REFERENCES meeting_participants(id),

    UNIQUE(meeting_id, participant_id),
    CONSTRAINT chk_resolution CHECK (resolution IN ('WAITING', 'ADMITTED', 'DENIED'))
);

COMMENT ON TABLE waiting_room_entries IS
  'Queue table containing details of participants waiting to be admitted to meetings.';
```

### Indexes

```sql
CREATE INDEX idx_waiting_room_meeting_id ON waiting_room_entries(meeting_id);
-- Fast fetch of active lobby queue
CREATE INDEX idx_waiting_room_active_queue 
    ON waiting_room_entries(meeting_id) 
    WHERE resolution = 'WAITING';
```

---

# 2. Key Queries

## Get active queue list

```sql
SELECT 
    w.id,
    w.participant_id,
    mp.display_name,
    w.requested_at
FROM waiting_room_entries w
JOIN meeting_participants mp ON mp.id = w.participant_id
WHERE w.meeting_id = :meetingId 
  AND w.resolution = 'WAITING'
ORDER BY w.requested_at ASC;
```

## Admit participant

```sql
UPDATE waiting_room_entries
SET resolution = 'ADMITTED',
    resolved_at = NOW(),
    resolved_by = :hostParticipantId
WHERE id = :entryId;
```

## Deny participant

```sql
UPDATE waiting_room_entries
SET resolution = 'DENIED',
    resolved_at = NOW(),
    resolved_by = :hostParticipantId
WHERE id = :entryId;
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `waiting_room_entries` | Deleted within 5 minutes of meeting end |

---

End of Document
