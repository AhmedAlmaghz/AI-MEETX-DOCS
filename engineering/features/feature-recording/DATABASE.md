# feature-recording/DATABASE.md

Document ID: RECORDING-DB-001

Version: 1.0.0

Status: Approved

Feature: Meeting Recording

Module: feature-recording

---

# 1. Tables

---

## meeting_recordings

Tracks all recording jobs, their status, and cloud storage locations.

```sql
CREATE TABLE meeting_recordings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id          UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    egress_id           VARCHAR(128),                          -- LiveKit Egress job ID
    layout              VARCHAR(20) NOT NULL DEFAULT 'SPEAKER_VIEW',
    status              VARCHAR(20) NOT NULL DEFAULT 'STARTING',
    storage_url         TEXT,                                  -- Cloud storage file URL
    file_size_bytes     BIGINT,
    duration_seconds    BIGINT,
    started_by          UUID NOT NULL REFERENCES meeting_participants(id),
    started_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    stopped_at          TIMESTAMPTZ,
    expires_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_layout CHECK (layout IN ('SPEAKER_VIEW', 'GALLERY_VIEW', 'AUDIO_ONLY')),
    CONSTRAINT chk_rec_status CHECK (status IN ('STARTING', 'ACTIVE', 'STOPPING', 'READY', 'FAILED', 'EXPIRED'))
);

COMMENT ON TABLE meeting_recordings IS
  'Recording job metadata, egress tracking, and storage pointers.';
```

### Indexes

```sql
CREATE INDEX idx_recordings_meeting ON meeting_recordings(meeting_id);
CREATE INDEX idx_recordings_status ON meeting_recordings(status);
CREATE INDEX idx_recordings_expires ON meeting_recordings(expires_at) WHERE status = 'READY';
```

---

# 2. Key Queries

## Get active recordings for a meeting

```sql
SELECT * FROM meeting_recordings
WHERE meeting_id = :meetingId
  AND status = 'ACTIVE';
```

## Find expired recordings for cleanup

```sql
SELECT id, storage_url FROM meeting_recordings
WHERE status = 'READY'
  AND expires_at < NOW();
```

---

# 3. Retention Policy

| Table | Retention |
|-------|-----------|
| `meeting_recordings` | 30 days after recording expires (configurable per plan) |
| Cloud storage file | Deleted when `expires_at` passes |

---

End of Document
