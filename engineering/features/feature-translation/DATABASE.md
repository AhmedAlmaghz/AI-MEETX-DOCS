# feature-translation/DATABASE.md

Document ID: TRANSLATION-DB-001

Version: 2.0.0

Status: Approved

Feature: Real-Time Translation

Phase: 11

---

# Overview

The Translation feature has a **minimal persistent storage footprint** by design.

Audio and transcript data are treated as ephemeral (in-memory only during the session).
Only session metadata and user language preferences are persisted.

This is a direct consequence of the Privacy-by-Design principle in TRANSLATION-REQ-001 (TR-PR-001 to TR-PR-004).

---

# Design Principles

1. **No audio storage** — Audio data (original or translated) is NEVER persisted to the database.
2. **No transcript storage by default** — Transcripts are only stored if recording is explicitly enabled.
3. **Session metadata only** — We store session start/end timestamps and language info for billing and analytics.
4. **User preferences are persisted** — So participants don't have to re-select their language every meeting.

---

# Tables

---

## translation_sessions

Stores metadata about each Gemini Live Translate session.

```sql
CREATE TABLE translation_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id      UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    session_id      VARCHAR(128) NOT NULL UNIQUE,        -- Gemini session ID
    target_language VARCHAR(10) NOT NULL,                -- BCP-47 code (e.g., "ar", "fr")
    model_id        VARCHAR(128) NOT NULL DEFAULT 'gemini-3.5-live-translate-preview',
    status          VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    participant_count INTEGER NOT NULL DEFAULT 0,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    terminated_at   TIMESTAMPTZ,
    termination_reason VARCHAR(64),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE translation_sessions IS
  'Metadata for each Gemini Live Translate session. No audio or transcript data is stored here.';

COMMENT ON COLUMN translation_sessions.session_id IS
  'The unique identifier assigned by Gemini for this translation WebSocket session.';

COMMENT ON COLUMN translation_sessions.termination_reason IS
  'One of: MEETING_ENDED, NO_PARTICIPANTS, ERROR, TIMEOUT, PRIVACY_CLEANUP';
```

### Indexes

```sql
CREATE INDEX idx_translation_sessions_meeting_id ON translation_sessions(meeting_id);
CREATE INDEX idx_translation_sessions_status ON translation_sessions(status);
CREATE INDEX idx_translation_sessions_target_language ON translation_sessions(meeting_id, target_language);
```

---

## participant_language_preferences

Stores each participant's preferred target language.

Used so that the system can automatically start translation when a participant joins a meeting.

```sql
CREATE TABLE participant_language_preferences (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_language   VARCHAR(10) NOT NULL,             -- BCP-47 code
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    enable_subtitles  BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(user_id)
);

COMMENT ON TABLE participant_language_preferences IS
  'Persistent language preferences for participants, applied automatically on meeting join.';
```

### Indexes

```sql
CREATE INDEX idx_lang_preferences_user_id ON participant_language_preferences(user_id);
```

---

## translation_session_participants

Junction table tracking which participants are connected to which session.

Used by the Translation Router to map participants to sessions.

```sql
CREATE TABLE translation_session_participants (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id      UUID NOT NULL REFERENCES translation_sessions(id) ON DELETE CASCADE,
    participant_id  UUID NOT NULL REFERENCES meeting_participants(id) ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at         TIMESTAMPTZ,

    UNIQUE(session_id, participant_id)
);

COMMENT ON TABLE translation_session_participants IS
  'Tracks participant membership in translation sessions. Ephemeral — records are deleted after meeting ends.';
```

### Indexes

```sql
CREATE INDEX idx_session_participants_session_id ON translation_session_participants(session_id);
CREATE INDEX idx_session_participants_participant_id ON translation_session_participants(participant_id);
```

---

## translation_transcripts (Optional — Recording Only)

This table is created only in deployments where recording is enabled.

It stores text transcript segments (NOT audio) when both host and participants have consented.

```sql
CREATE TABLE translation_transcripts (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID NOT NULL REFERENCES translation_sessions(id) ON DELETE CASCADE,
    meeting_id        UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    speaker_id        UUID REFERENCES users(id),
    original_text     TEXT,
    translated_text   TEXT,
    target_language   VARCHAR(10) NOT NULL,
    start_ms          INTEGER NOT NULL,
    end_ms            INTEGER NOT NULL,
    is_final          BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE translation_transcripts IS
  'Stores text-only transcripts when recording is enabled and all parties have consented. NOT populated by default.';
```

### Indexes

```sql
CREATE INDEX idx_transcripts_meeting_id ON translation_transcripts(meeting_id);
CREATE INDEX idx_transcripts_session_id ON translation_transcripts(session_id);
CREATE INDEX idx_transcripts_speaker_id ON translation_transcripts(speaker_id);
```

---

# Retention Policies

| Table | Retention Policy |
|-------|-----------------|
| `translation_sessions` | 90 days after session termination |
| `participant_language_preferences` | Indefinite (user profile data) |
| `translation_session_participants` | Deleted within 5 minutes of `MeetingEndedEvent` |
| `translation_transcripts` | Deleted within 30 days of meeting end (configurable) |

---

# Cleanup Process

On `MeetingEndedEvent`:

```sql
-- 1. Mark all active sessions for the meeting as terminated
UPDATE translation_sessions
SET status = 'TERMINATED',
    terminated_at = NOW(),
    termination_reason = 'MEETING_ENDED',
    updated_at = NOW()
WHERE meeting_id = :meetingId
  AND status = 'ACTIVE';

-- 2. Remove all participant session mappings
DELETE FROM translation_session_participants
WHERE session_id IN (
    SELECT id FROM translation_sessions
    WHERE meeting_id = :meetingId
);
```

---

# Data Dictionary

| Column | Type | Description |
|--------|------|-------------|
| `target_language` | VARCHAR(10) | BCP-47 language tag (e.g., "ar-SA", "fr", "zh") |
| `model_id` | VARCHAR(128) | Gemini model used for translation |
| `status` | VARCHAR(32) | Session status: ACTIVE, TERMINATED, ERROR |
| `termination_reason` | VARCHAR(64) | Reason session ended |
| `is_final` | BOOLEAN | Whether transcript segment is finalized or interim |

---

End of Document