# feature-meeting/participants/DATABASE.md

Document ID: PARTICIPANTS-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Participants Management

Subdomain: feature-meeting/participants

---

# 1. Tables

---

## meeting_participants

The primary table storing each participant's membership in a meeting.

```sql
CREATE TABLE meeting_participants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id),
    display_name        VARCHAR(100) NOT NULL,
    role                VARCHAR(20) NOT NULL DEFAULT 'ATTENDEE',
    status              VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    is_audio_muted      BOOLEAN NOT NULL DEFAULT FALSE,
    muted_by            UUID REFERENCES meeting_participants(id),
    muted_at            TIMESTAMPTZ,
    is_camera_on        BOOLEAN NOT NULL DEFAULT FALSE,
    is_screen_sharing   BOOLEAN NOT NULL DEFAULT FALSE,
    livekit_token       TEXT,
    joined_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at             TIMESTAMPTZ,
    removed_at          TIMESTAMPTZ,
    removed_by          UUID REFERENCES meeting_participants(id),
    removal_reason      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_role CHECK (role IN ('HOST', 'CO_HOST', 'MODERATOR', 'SPEAKER', 'ATTENDEE')),
    CONSTRAINT chk_status CHECK (status IN ('WAITING', 'ACTIVE', 'LEFT', 'REMOVED', 'DISCONNECTED'))
);

COMMENT ON TABLE meeting_participants IS
  'Tracks all participants in a meeting, their roles, media state, and participation history.';

COMMENT ON COLUMN meeting_participants.livekit_token IS
  'LiveKit room access token. Revoked on participant leave or removal.';

COMMENT ON COLUMN meeting_participants.muted_by IS
  'NULL = self-muted. Non-null = muted by host/moderator.';
```

### Indexes

```sql
-- Fast lookup of active participants in a meeting
CREATE INDEX idx_meeting_participants_meeting_id ON meeting_participants(meeting_id);

-- Check if user is already in meeting
CREATE INDEX idx_meeting_participants_user_meeting
    ON meeting_participants(meeting_id, user_id);

-- Filter by status
CREATE INDEX idx_meeting_participants_status ON meeting_participants(status);

-- Count active participants quickly
CREATE INDEX idx_meeting_participants_active
    ON meeting_participants(meeting_id, status)
    WHERE status = 'ACTIVE';
```

---

## waiting_room_entries

Tracks participants who are waiting for host approval before entering the meeting.

```sql
CREATE TABLE waiting_room_entries (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,
    resolution          VARCHAR(20),     -- 'ADMITTED' | 'DENIED'
    resolved_by         UUID REFERENCES meeting_participants(id),

    UNIQUE(meeting_id, participant_id)
);

COMMENT ON TABLE waiting_room_entries IS
  'Waiting room queue. Participants remain here until admitted or denied by host.';
```

### Indexes

```sql
CREATE INDEX idx_waiting_room_meeting_id ON waiting_room_entries(meeting_id);
CREATE INDEX idx_waiting_room_unresolved
    ON waiting_room_entries(meeting_id)
    WHERE resolved_at IS NULL;
```

---

## participant_bans

Stores users who have been removed from a meeting and are banned from rejoining.

```sql
CREATE TABLE participant_bans (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    banned_by       UUID NOT NULL REFERENCES users(id),
    reason          TEXT,
    banned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(meeting_id, user_id)
);

COMMENT ON TABLE participant_bans IS
  'Users removed by host are banned from rejoining the same meeting.';
```

### Indexes

```sql
CREATE INDEX idx_participant_bans_meeting_user ON participant_bans(meeting_id, user_id);
```

---

# 2. Views

## active_participants_view

Fast read view for real-time participant list.

```sql
CREATE VIEW active_participants_view AS
SELECT
    mp.id,
    mp.meeting_id,
    mp.user_id,
    mp.display_name,
    mp.role,
    mp.is_audio_muted,
    mp.is_camera_on,
    mp.is_screen_sharing,
    mp.joined_at
FROM meeting_participants mp
WHERE mp.status = 'ACTIVE';

COMMENT ON VIEW active_participants_view IS
  'Read-optimized view for rendering the active participant list in the meeting room.';
```

---

# 3. Key Queries

## Count active participants in a meeting

```sql
SELECT COUNT(*)
FROM meeting_participants
WHERE meeting_id = :meetingId
  AND status = 'ACTIVE';
```

## Get all active participants with roles

```sql
SELECT id, user_id, display_name, role, is_audio_muted, is_camera_on, is_screen_sharing
FROM meeting_participants
WHERE meeting_id = :meetingId
  AND status = 'ACTIVE'
ORDER BY
    CASE role
        WHEN 'HOST' THEN 1
        WHEN 'CO_HOST' THEN 2
        WHEN 'MODERATOR' THEN 3
        WHEN 'SPEAKER' THEN 4
        WHEN 'ATTENDEE' THEN 5
    END ASC,
    joined_at ASC;
```

## Check if user is banned from a meeting

```sql
SELECT EXISTS (
    SELECT 1 FROM participant_bans
    WHERE meeting_id = :meetingId
      AND user_id = :userId
) AS is_banned;
```

## Find host(s) of a meeting

```sql
SELECT * FROM meeting_participants
WHERE meeting_id = :meetingId
  AND role IN ('HOST', 'CO_HOST')
  AND status = 'ACTIVE';
```

---

# 4. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_participants` | 12 months after meeting end |
| `waiting_room_entries` | 30 days after meeting end |
| `participant_bans` | Duration of meeting + 7 days |

---

End of Document
