-- V4__recording_notification_tables.sql
-- Phase 10: Recording and Notification system

CREATE TABLE IF NOT EXISTS meeting_recordings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    egress_id           VARCHAR(128),
    layout              VARCHAR(20) NOT NULL DEFAULT 'speaker_view',
    status              VARCHAR(20) NOT NULL DEFAULT 'starting',
    storage_url         TEXT,
    file_size_bytes     BIGINT,
    duration_seconds    BIGINT,
    started_by          UUID NOT NULL REFERENCES meeting_participants(id),
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stopped_at          TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type                VARCHAR(64) NOT NULL,
    channel             VARCHAR(20) NOT NULL,
    title               VARCHAR(256) NOT NULL,
    body                TEXT NOT NULL,
    data                JSONB NOT NULL DEFAULT '{}',
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
    idempotency_key     VARCHAR(256) NOT NULL UNIQUE,
    read_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at             TIMESTAMPTZ,

    CONSTRAINT chk_notif_status CHECK (status IN ('pending', 'sent', 'failed', 'suppressed')),
    CONSTRAINT chk_notif_channel CHECK (channel IN ('push', 'email', 'sms'))
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences         JSONB NOT NULL DEFAULT '{}',
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS device_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform        VARCHAR(10) NOT NULL,
    token           TEXT NOT NULL UNIQUE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_platform CHECK (platform IN ('fcm', 'apns'))
);

CREATE INDEX IF NOT EXISTS idx_recordings_meeting ON meeting_recordings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_recordings_status ON meeting_recordings(status);
CREATE INDEX IF NOT EXISTS idx_recordings_expires ON meeting_recordings(expires_at) WHERE status = 'ready';
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id) WHERE is_active = TRUE;