# feature-meeting/shared/DATABASE.md

Document ID: SHARED-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Shared Kernel & Cross-Cutting Concerns

Subdomain: feature-meeting/shared

---

# 1. Overview

The `shared` subdomain does not own any database tables directly.

It provides the canonical schema for the `meetings` master table, which is the root entity that all other `feature-meeting` subdomains reference via foreign keys.

---

# 2. Master Table: `meetings`

This is the central anchor table for the entire meeting domain.

```sql
CREATE TABLE meetings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status          VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    created_by      UUID NOT NULL,                              -- References users.id
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    
    CONSTRAINT chk_meeting_status CHECK (
        status IN ('SCHEDULED', 'WAITING', 'ACTIVE', 'PAUSED', 'ENDED')
    )
);

COMMENT ON TABLE meetings IS
  'Master anchor table for all meeting-related data. All subdomain tables reference this table via foreign key.';
```

---

# 3. Entity Relationship Overview

```
meetings (master)
│
├── meeting_participants        -- feature-meeting/participants
├── meeting_permissions         -- feature-meeting/permissions
├── participant_permission_overrides  -- feature-meeting/permissions
├── meeting_rooms               -- feature-meeting/room
├── waiting_room_entries        -- feature-meeting/waiting-room
├── meeting_invitations         -- feature-meeting/invitations
├── meeting_passcodes           -- feature-meeting/invitations
├── scheduled_meetings          -- feature-meeting/scheduling
├── meeting_reminders           -- feature-meeting/scheduling
└── meeting_presence_analytics  -- feature-meeting/presence
```

---

# 4. Shared Database Conventions

All tables within `feature-meeting` MUST follow these conventions:

| Convention | Rule |
|------------|------|
| Primary Key | `UUID` using `gen_random_uuid()` |
| Timestamps | `TIMESTAMPTZ` with `DEFAULT NOW()` |
| Status fields | `VARCHAR(20)` with CHECK constraint |
| Foreign Keys | Reference `meetings(id) ON DELETE CASCADE` |
| Indexes | Created for all foreign key columns |

---

End of Document
