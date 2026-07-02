# feature-meeting/room/DATABASE.md

Document ID: ROOM-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Room Management

Subdomain: feature-meeting/room

---

# 1. Tables

---

## meeting_rooms

Stores metadata about each LiveKit room associated with a meeting.

```sql
CREATE TABLE meeting_rooms (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    livekit_room_name   VARCHAR(256) NOT NULL UNIQUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'CREATING',
    max_participants    INTEGER NOT NULL DEFAULT 100,
    is_locked           BOOLEAN NOT NULL DEFAULT FALSE,
    is_mute_all_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    is_video_disabled   BOOLEAN NOT NULL DEFAULT FALSE,
    allow_multi_screen  BOOLEAN NOT NULL DEFAULT FALSE,
    max_video_bitrate_kbps INTEGER NOT NULL DEFAULT 2500,
    audio_quality       VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    destroyed_at        TIMESTAMPTZ,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_room_status CHECK (status IN ('CREATING', 'ACTIVE', 'LOCKED', 'ENDED')),
    CONSTRAINT chk_audio_quality CHECK (audio_quality IN ('ECONOMY', 'STANDARD', 'HIGH'))
);

COMMENT ON TABLE meeting_rooms IS
  'One-to-one with meetings. Stores LiveKit room configuration and current state.';

COMMENT ON COLUMN meeting_rooms.livekit_room_name IS
  'Naming convention: meeting_{meetingId}. Used as the LiveKit room identifier.';
```

### Indexes

```sql
CREATE INDEX idx_meeting_rooms_meeting_id ON meeting_rooms(meeting_id);
CREATE INDEX idx_meeting_rooms_status ON meeting_rooms(status);
```

---

## room_events_log

Audit log for all significant room events (lock, unlock, mute all, etc.)

```sql
CREATE TABLE room_events_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    room_id         UUID NOT NULL REFERENCES meeting_rooms(id) ON DELETE CASCADE,
    event_type      VARCHAR(64) NOT NULL,
    performed_by    UUID REFERENCES users(id),
    details         JSONB,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE room_events_log IS
  'Immutable audit log of host-initiated room actions.';

COMMENT ON COLUMN room_events_log.event_type IS
  'One of: ROOM_LOCKED, ROOM_UNLOCKED, MUTE_ALL, VIDEO_DISABLED, VIDEO_ENABLED, SCREEN_SHARE_CHANGED';
```

### Indexes

```sql
CREATE INDEX idx_room_events_log_meeting_id ON room_events_log(meeting_id);
CREATE INDEX idx_room_events_log_occurred_at ON room_events_log(occurred_at DESC);
```

---

# 2. Key Queries

## Get room by meeting ID

```sql
SELECT * FROM meeting_rooms
WHERE meeting_id = :meetingId;
```

## Get room status

```sql
SELECT status, is_locked, is_mute_all_enabled, is_video_disabled
FROM meeting_rooms
WHERE meeting_id = :meetingId;
```

## Mark room as ended

```sql
UPDATE meeting_rooms
SET status = 'ENDED',
    destroyed_at = NOW(),
    updated_at = NOW()
WHERE meeting_id = :meetingId;
```

## Log a room event

```sql
INSERT INTO room_events_log (meeting_id, room_id, event_type, performed_by, details)
VALUES (:meetingId, :roomId, :eventType, :performedBy, :details::jsonb);
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_rooms` | 90 days after room destruction |
| `room_events_log` | 12 months |

---

End of Document
