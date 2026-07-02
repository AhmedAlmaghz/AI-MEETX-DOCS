# feature-chat/DATABASE.md
Document ID: CHAT-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Chat

Priority: P1

Owner: Platform Architecture Team

Classification: Mandatory

---

# 1. Purpose

Defines storage patterns for meeting persistent chats, private channels, and file attachments.

---

# 2. Schema Setup (PostgreSQL)

```sql
CREATE TABLE meeting_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES users(id),
    thread_parent_id UUID REFERENCES meeting_messages(id),
    message_text    TEXT NOT NULL,
    is_private      BOOLEAN NOT NULL DEFAULT FALSE,
    recipient_id    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

# 3. Indexes

```sql
CREATE INDEX idx_meeting_messages_lookup ON meeting_messages(meeting_id, created_at ASC);
```

---

End of Document