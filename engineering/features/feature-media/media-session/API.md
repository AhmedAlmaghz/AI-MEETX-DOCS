# engineering/features/feature-media/media-session/API.md

Document ID: MEDIA-SESSION-API-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Session

---

# Purpose

Defines the external API contracts for managing media sessions.

Media transport implementation (WebRTC, LiveKit, etc.) is abstracted behind the Media infrastructure.

---

# Base Path

/api/v1/media/sessions

Authorization

Bearer Token Required

---

# Resource

MediaSession

Primary Identifier

sessionId (UUID)

---

# Endpoints

## Create Media Session

POST /

Creates a media session for a participant.

### Request

```json
{
  "meetingId": "...",
  "participantId": "..."
}
```

### Response

201 Created

```text
MediaSessionDto
```

---

## Get Media Session

GET /{sessionId}

Returns

MediaSessionDto

---

## Initialize Session

POST /{sessionId}/initialize

Response

200 OK

State

Created → Initializing → Ready

---

## Activate Session

POST /{sessionId}/activate

Response

200 OK

State

Ready → Active

---

## Pause Session

POST /{sessionId}/pause

Response

200 OK

State

Active → Paused

---

## Resume Session

POST /{sessionId}/resume

Response

200 OK

State

Paused → Active

---

## Recover Session

POST /{sessionId}/recover

Response

200 OK

State

Recovering → Active

---

## Close Session

DELETE /{sessionId}

Response

204 No Content

State

Active/Paused → Closed

---

# DTO

MediaSessionDto

```text
sessionId

meetingId

participantId

state

transportState

recoveryState

capabilities

createdAt

updatedAt
```

---

# Validation

Participant SHALL belong to the specified meeting.

Meeting SHALL be Active.

Duplicate active sessions SHALL be rejected.

---

# Error Codes

SESSION_NOT_FOUND

SESSION_ALREADY_EXISTS

INVALID_SESSION_STATE

MEETING_NOT_ACTIVE

PARTICIPANT_NOT_FOUND

RECOVERY_FAILED

VALIDATION_ERROR

UNAUTHORIZED

NETWORK_ERROR

SERVER_ERROR

---

# Retry Policy

GET

Automatic Retry

POST

Manual Retry if idempotent

DELETE

No Retry

---

# Security

Only the authenticated participant or authorized host may manage the session.

Transport implementation details SHALL NOT be exposed.

---

# Audit

The following operations SHALL generate audit records:

- Session Created
- Session Activated
- Session Paused
- Session Resumed
- Session Recovered
- Session Closed

---

# Completion Criteria

✓ REST contract implemented

✓ DTO defined

✓ Validation implemented

✓ Authorization enforced

✓ Tests passing

---

End of Document