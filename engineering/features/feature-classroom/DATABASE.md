# feature-classroom/DATABASE.md

Document ID: CLASSROOM-DB-001

Version: 1.0.0

Status: Approved

Feature: Virtual Classroom

Module: feature-classroom

---

# 1. Tables

---

## classroom_sessions

```sql
CREATE TABLE classroom_sessions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id                  UUID NOT NULL UNIQUE REFERENCES meetings(id) ON DELETE CASCADE,
    status                      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    allow_student_whiteboard    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_classroom_status CHECK (status IN ('ACTIVE', 'PAUSED', 'ENDED'))
);
```

---

## attendance_records

```sql
CREATE TABLE attendance_records (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_session_id    UUID NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
    participant_id          UUID NOT NULL REFERENCES meeting_participants(id),
    joined_at               TIMESTAMPTZ NOT NULL,
    left_at                 TIMESTAMPTZ,
    total_duration_minutes  BIGINT NOT NULL DEFAULT 0,

    UNIQUE(classroom_session_id, participant_id)
);

CREATE INDEX idx_attendance_session ON attendance_records(classroom_session_id);
```

---

## quizzes

```sql
CREATE TABLE quizzes (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_session_id    UUID NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
    question                TEXT NOT NULL,
    options                 JSONB NOT NULL,                    -- [{id, text}]
    correct_option_id       VARCHAR(64),
    show_correct_answer     BOOLEAN NOT NULL DEFAULT FALSE,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quiz_status CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED'))
);

CREATE INDEX idx_quizzes_session ON quizzes(classroom_session_id);
```

---

## quiz_responses

```sql
CREATE TABLE quiz_responses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id             UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES meeting_participants(id),
    selected_option_id  VARCHAR(64) NOT NULL,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(quiz_id, participant_id)
);

CREATE INDEX idx_quiz_responses_quiz ON quiz_responses(quiz_id);
```

---

## breakout_rooms

```sql
CREATE TABLE breakout_rooms (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_session_id    UUID NOT NULL REFERENCES classroom_sessions(id) ON DELETE CASCADE,
    name                    VARCHAR(128) NOT NULL,
    livekit_room_name       VARCHAR(256) NOT NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE breakout_room_assignments (
    breakout_room_id    UUID NOT NULL REFERENCES breakout_rooms(id) ON DELETE CASCADE,
    participant_id      UUID NOT NULL REFERENCES meeting_participants(id),
    PRIMARY KEY (breakout_room_id, participant_id)
);
```

---

# 2. Retention Policy

| Table | Retention |
|-------|-----------|
| `classroom_sessions` | 12 months |
| `attendance_records` | 12 months |
| `quizzes` + `quiz_responses` | 12 months |
| `breakout_rooms` | Deleted within 5 minutes of classroom end |

---

End of Document
