# feature-meeting/permissions/DATABASE.md

Document ID: PERMISSIONS-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Permissions & Role-Based Access Control

Subdomain: feature-meeting/permissions

---

# 1. Tables

---

## meeting_permissions

Stores the global lockout configuration and waiting room policy for each meeting.

```sql
CREATE TABLE meeting_permissions (
    meeting_id                  UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    lock_attendee_audio         BOOLEAN NOT NULL DEFAULT FALSE,
    lock_attendee_video         BOOLEAN NOT NULL DEFAULT FALSE,
    lock_attendee_chat          BOOLEAN NOT NULL DEFAULT FALSE,
    allow_attendee_screen_share BOOLEAN NOT NULL DEFAULT FALSE,
    waiting_room_policy         VARCHAR(32) NOT NULL DEFAULT 'AUTHENTICATED_USERS',
    updated_by                  UUID REFERENCES meeting_participants(id),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_waiting_room_policy CHECK (
        waiting_room_policy IN ('EVERYONE', 'AUTHENTICATED_USERS', 'INVITED_GUESTS', 'NONE')
    )
);

COMMENT ON TABLE meeting_permissions IS
  'Stores global permissions lockout rules and bypass policy for attendees.';
```

### Indexes

```sql
CREATE INDEX idx_meeting_permissions_policy ON meeting_permissions(waiting_room_policy);
```

---

## participant_permission_overrides

Stores the individual overrides for participants, as well as hand-raising status.

```sql
CREATE TABLE participant_permission_overrides (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id                  UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    participant_id              UUID NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    allowed_permissions         VARCHAR(64)[] NOT NULL DEFAULT '{}',  -- Array of allowed PermissionFlags
    denied_permissions          VARCHAR(64)[] NOT NULL DEFAULT '{}',  -- Array of denied PermissionFlags
    is_hand_raised              BOOLEAN NOT NULL DEFAULT FALSE,
    hand_raised_at              TIMESTAMPTZ,
    speak_permission_granted_at TIMESTAMPTZ,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(meeting_id, participant_id)
);

COMMENT ON TABLE participant_permission_overrides IS
  'Granular overrides that supersede default role permissions, and track raised hands.';
```

### Indexes

```sql
CREATE INDEX idx_permission_overrides_participant ON participant_permission_overrides(participant_id);
CREATE INDEX idx_permission_overrides_meeting ON participant_permission_overrides(meeting_id);
CREATE INDEX idx_permission_overrides_raised_hand 
    ON participant_permission_overrides(meeting_id) 
    WHERE is_hand_raised = TRUE;
```

---

# 2. Key Queries

## Retrieve combined permissions for check

```sql
SELECT 
    mp.role,
    g.lock_attendee_audio,
    g.lock_attendee_video,
    g.lock_attendee_chat,
    g.allow_attendee_screen_share,
    o.allowed_permissions,
    o.denied_permissions
FROM meeting_participants mp
LEFT JOIN meeting_permissions g ON g.meeting_id = mp.meeting_id
LEFT JOIN participant_permission_overrides o ON o.participant_id = mp.id
WHERE mp.id = :participantId;
```

## Get all raised hands in a meeting sorted by time

```sql
SELECT 
    o.participant_id, 
    mp.display_name,
    o.hand_raised_at
FROM participant_permission_overrides o
JOIN meeting_participants mp ON mp.id = o.participant_id
WHERE o.meeting_id = :meetingId 
  AND o.is_hand_raised = TRUE
ORDER BY o.hand_raised_at ASC;
```

## Clear all overrides on meeting end

```sql
DELETE FROM participant_permission_overrides 
WHERE meeting_id = :meetingId;
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_permissions` | 90 days after meeting ends |
| `participant_permission_overrides` | Deleted within 5 minutes of meeting end |

---

End of Document
