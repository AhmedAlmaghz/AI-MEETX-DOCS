# feature-meeting/participants/API.md

Document ID: PARTICIPANTS-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Participants Management

Base Path: /api/v1/meetings/{meetingId}/participants

---

# Overview

The Participants API manages participant membership, roles, and media state within an active meeting.

All endpoints require a valid JWT token and the requesting participant must be an active member of the specified meeting (unless noted otherwise).

---

# Authentication

All endpoints require:
- Header: `Authorization: Bearer <jwt_token>`
- The requesting user must have an active session for the specified meeting.

---

# Endpoints

---

## 1. Join Meeting

```
POST /api/v1/meetings/{meetingId}/participants/join
```

### Request Body

```json
{
  "displayName": "Ahmed Al-Farsi"
}
```

### Response (200 OK)

```json
{
  "participantId": "par_abc123",
  "meetingId": "meeting_xyz",
  "userId": "user_001",
  "displayName": "Ahmed Al-Farsi",
  "role": "ATTENDEE",
  "status": "ACTIVE",
  "livekitToken": "eyJhbGciOiJIUzI1NiIs...",
  "joinedAt": "2025-01-15T10:30:00Z"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Joined successfully |
| 202 | Added to waiting room (waiting for host approval) |
| 400 | Invalid display name |
| 403 | Meeting requires invite, user is banned |
| 404 | Meeting not found |
| 409 | Already an active participant |
| 422 | Meeting is full (participant count limit reached) |
| 423 | Meeting is not in ACTIVE or WAITING state |

---

## 2. Leave Meeting

```
POST /api/v1/meetings/{meetingId}/participants/{participantId}/leave
```

### Response (200 OK)

```json
{
  "status": "LEFT",
  "leftAt": "2025-01-15T11:00:00Z"
}
```

---

## 3. Remove Participant (Host/Moderator Only)

```
DELETE /api/v1/meetings/{meetingId}/participants/{participantId}
```

### Request Body

```json
{
  "reason": "Disruptive behavior"
}
```

### Response (200 OK)

```json
{
  "participantId": "par_target",
  "status": "REMOVED",
  "removedAt": "2025-01-15T10:45:00Z",
  "removedBy": "par_host",
  "reason": "Disruptive behavior"
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Removed successfully |
| 403 | Caller does not have MODERATOR or higher role |
| 404 | Participant not found |

---

## 4. Change Participant Role (Host/Co-Host Only)

```
PATCH /api/v1/meetings/{meetingId}/participants/{participantId}/role
```

### Request Body

```json
{
  "newRole": "MODERATOR"
}
```

### Response (200 OK)

```json
{
  "participantId": "par_target",
  "previousRole": "ATTENDEE",
  "newRole": "MODERATOR",
  "changedBy": "par_host",
  "changedAt": "2025-01-15T10:35:00Z"
}
```

---

## 5. Mute Participant (Host/Moderator Only)

```
POST /api/v1/meetings/{meetingId}/participants/{participantId}/mute
```

### Response (200 OK)

```json
{
  "participantId": "par_target",
  "isMuted": true,
  "mutedBy": "par_host",
  "mutedAt": "2025-01-15T10:40:00Z"
}
```

---

## 6. List Active Participants

```
GET /api/v1/meetings/{meetingId}/participants
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | ACTIVE | Filter by status (ACTIVE, WAITING, LEFT) |
| role | string | - | Filter by role |

### Response (200 OK)

```json
{
  "meetingId": "meeting_xyz",
  "totalActive": 12,
  "participants": [
    {
      "participantId": "par_abc123",
      "userId": "user_001",
      "displayName": "Ahmed Al-Farsi",
      "role": "HOST",
      "isAudioMuted": false,
      "isCameraOn": true,
      "isScreenSharing": false,
      "joinedAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

## 7. Waiting Room — Admit Participant (Host Only)

```
POST /api/v1/meetings/{meetingId}/waiting-room/{participantId}/admit
```

### Response (200 OK)

```json
{
  "participantId": "par_waiting",
  "status": "ACTIVE",
  "admittedAt": "2025-01-15T10:28:00Z"
}
```

---

## 8. Waiting Room — Deny Participant (Host Only)

```
POST /api/v1/meetings/{meetingId}/waiting-room/{participantId}/deny
```

### Response (200 OK)

```json
{
  "participantId": "par_waiting",
  "status": "REMOVED",
  "deniedAt": "2025-01-15T10:29:00Z"
}
```

---

## 9. Get Waiting Room Queue (Host/Moderator Only)

```
GET /api/v1/meetings/{meetingId}/waiting-room
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_xyz",
  "waitingCount": 3,
  "waiting": [
    {
      "participantId": "par_w1",
      "displayName": "Sara Ahmad",
      "requestedAt": "2025-01-15T10:27:00Z"
    }
  ]
}
```

---

# Real-Time Events (WebSocket)

The following events are delivered to all active participants via the real-time channel:

| Event | Trigger |
|-------|---------|
| `PARTICIPANT_JOINED` | New participant joins |
| `PARTICIPANT_LEFT` | Participant leaves voluntarily |
| `PARTICIPANT_REMOVED` | Participant removed by host |
| `PARTICIPANT_ROLE_CHANGED` | Role promotion/demotion |
| `PARTICIPANT_MUTED` | Participant muted by host |
| `PARTICIPANT_UNMUTED` | Participant unmuted |
| `WAITING_ROOM_UPDATE` | Someone enters or is admitted from waiting room |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 403 | INSUFFICIENT_ROLE | Caller does not have the required role |
| 404 | PARTICIPANT_NOT_FOUND | Target participant does not exist |
| 409 | ALREADY_PARTICIPANT | User is already an active participant |
| 422 | MEETING_FULL | Participant count limit reached |
| 423 | INVALID_MEETING_STATE | Meeting is not in the correct state to allow this action |
| 429 | RATE_LIMIT | Too many join attempts |

---

End of Document
