-- V1__core_tables.sql
-- AI MeetX — Core tables: users, meetings, participants
-- Phase 01-03: Foundation, Auth, Meeting lifecycle

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(320) UNIQUE NOT NULL,
    display_name    VARCHAR(128) NOT NULL,
    avatar_url      TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active',
    role            VARCHAR(20) NOT NULL DEFAULT 'member',
    preferred_language VARCHAR(2),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meetings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(256) NOT NULL,
    description     TEXT,
    host_id          UUID NOT NULL REFERENCES users(id),
    status          VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    passcode        VARCHAR(32),
    max_participants INTEGER NOT NULL DEFAULT 100,
    livekit_room_name VARCHAR(128),
    started_at      TIMESTAMPTZ,
    ended_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS meeting_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    user_id          UUID REFERENCES users(id),
    display_name    VARCHAR(128) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'attendee',
    status          VARCHAR(20) NOT NULL DEFAULT 'waiting',
    is_muted        BOOLEAN NOT NULL DEFAULT TRUE,
    is_video_on     BOOLEAN NOT NULL DEFAULT FALSE,
    is_screen_sharing BOOLEAN NOT NULL DEFAULT FALSE,
    is_hand_raised  BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at       TIMESTAMPTZ,
    left_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_meetings_host ON meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_participants_meeting ON meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON meeting_participants(user_id);