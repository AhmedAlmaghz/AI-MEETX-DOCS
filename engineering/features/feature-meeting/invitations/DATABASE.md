# feature-meeting/invitations/DATABASE.md

Document ID: INVITATIONS-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Invitations & RSVP

Subdomain: feature-meeting/invitations

---

# 1. Tables

---

## meeting_invitations

Stores the individual invitations sent to invitees.

```sql
CREATE TABLE meeting_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    invitee_email   VARCHAR(256) NOT NULL,
    invitee_name    VARCHAR(256),
    invitee_role    VARCHAR(20) NOT NULL DEFAULT 'ATTENDEE',
    token           VARCHAR(128) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at    TIMESTAMPTZ,

    CONSTRAINT chk_rsvp_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED')),
    CONSTRAINT chk_invitee_role CHECK (invitee_role IN ('HOST', 'CO_HOST', 'MODERATOR', 'SPEAKER', 'ATTENDEE'))
);

COMMENT ON TABLE meeting_invitations IS
  'Stores invitee email, direct token string, and their accept/decline state.';
```

### Indexes

```sql
CREATE INDEX idx_invitations_meeting ON meeting_invitations(meeting_id);
CREATE INDEX idx_invitations_token ON meeting_invitations(token);
CREATE INDEX idx_invitations_email ON meeting_invitations(invitee_email);
```

---

## meeting_passcodes

Stores passcodes for meetings that require them. Passcodes are hashed using bcrypt.

```sql
CREATE TABLE meeting_passcodes (
    meeting_id          UUID PRIMARY KEY REFERENCES meetings(id) ON DELETE CASCADE,
    passcode_hash       VARCHAR(256) NOT NULL,
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE meeting_passcodes IS
  'Stores BCrypt hash of passcodes required to enter secure meetings.';
```

---

# 2. Key Queries

## Find invitation by token

```sql
SELECT * FROM meeting_invitations
WHERE token = :token;
```

## Get RSVP breakdown for a meeting

```sql
SELECT 
    status, 
    COUNT(*) as count
FROM meeting_invitations
WHERE meeting_id = :meetingId
GROUP BY status;
```

## Validate passcode

```sql
SELECT passcode_hash
FROM meeting_passcodes
WHERE meeting_id = :meetingId 
  AND is_enabled = TRUE;
```

## Mark expired invitations

```sql
UPDATE meeting_invitations
SET status = 'EXPIRED'
WHERE status = 'PENDING' 
  AND expires_at < NOW();
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_invitations` | 6 months after meeting ends |
| `meeting_passcodes` | Deleted immediately on meeting end |

---

End of Document
