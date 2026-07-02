# feature-notification/DATABASE.md

Document ID: NOTIF-DB-001

Version: 1.0.0

Status: Approved

Feature: Notification System

Module: feature-notification

---

# 1. Tables

---

## notifications

Stores a log of all dispatched notifications.

```sql
CREATE TABLE notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id        UUID NOT NULL,                -- References users.id
    type                VARCHAR(64) NOT NULL,
    channel             VARCHAR(20) NOT NULL,          -- 'PUSH' | 'EMAIL' | 'SMS'
    title               VARCHAR(256) NOT NULL,
    body                TEXT NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    idempotency_key     VARCHAR(256) NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at             TIMESTAMPTZ,

    CONSTRAINT chk_notif_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'SUPPRESSED')),
    CONSTRAINT chk_notif_channel CHECK (channel IN ('PUSH', 'EMAIL', 'SMS'))
);

COMMENT ON TABLE notifications IS
  'Audit log of all dispatched notifications across all channels.';
```

### Indexes

```sql
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_idempotency ON notifications(idempotency_key);
```

---

## user_notification_preferences

Stores per-user notification settings.

```sql
CREATE TABLE user_notification_preferences (
    user_id             UUID PRIMARY KEY,
    preferences         JSONB NOT NULL DEFAULT '{}',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_notification_preferences IS
  'User-level notification channel preferences per notification type.';
```

**Example JSONB structure:**
```json
{
  "MEETING_REMINDER": ["PUSH", "EMAIL"],
  "RECORDING_READY": ["EMAIL"],
  "MEETING_INVITATION": ["EMAIL"]
}
```

---

## device_tokens

Stores FCM/APNs device tokens for push notifications.

```sql
CREATE TABLE device_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    platform        VARCHAR(10) NOT NULL,          -- 'FCM' | 'APNS'
    token           TEXT NOT NULL UNIQUE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_platform CHECK (platform IN ('FCM', 'APNS'))
);
```

### Indexes

```sql
CREATE INDEX idx_device_tokens_user ON device_tokens(user_id) WHERE is_active = TRUE;
```

---

# 2. Retention Policy

| Table | Retention |
|-------|-----------|
| `notifications` | 90 days |
| `user_notification_preferences` | Indefinite (user-owned) |
| `device_tokens` | Deleted when user deactivates token or uninstalls app |

---

End of Document
