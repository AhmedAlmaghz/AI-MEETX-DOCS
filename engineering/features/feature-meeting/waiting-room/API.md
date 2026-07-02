# feature-meeting/waiting-room/API.md

Document ID: WAITING-ROOM-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Waiting Room / Lobby Management

Base Path: /api/v1/meetings/{meetingId}/waiting-room

---

# Overview

Provides endpoints to manage waiting room entries, admissions, rejections, and queue listings.

---

# Endpoints

---

## 1. Request Entry (Knock)

Request entry into the meeting. The participant is placed in the waiting lobby.

```
POST /api/v1/meetings/{meetingId}/waiting-room/knock
```

### Request Body

```json
{
  "displayName": "Sarah Connor"
}
```

### Response (200 OK)

```json
{
  "entryId": "wr_entry_abc123",
  "meetingId": "meeting_xyz",
  "displayName": "Sarah Connor",
  "status": "WAITING",
  "requestedAt": "2025-01-15T10:30:00Z"
}
```

---

## 2. Get Waiting Room Queue (Host/Moderator Only)

```
GET /api/v1/meetings/{meetingId}/waiting-room/entries
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_xyz",
  "waitingCount": 1,
  "queue": [
    {
      "entryId": "wr_entry_abc123",
      "participantId": "par_waiting_456",
      "displayName": "Sarah Connor",
      "requestedAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## 3. Admit Participant (Host/Moderator Only)

```
POST /api/v1/meetings/{meetingId}/waiting-room/admit/{entryId}
```

### Response (200 OK)

```json
{
  "entryId": "wr_entry_abc123",
  "status": "ADMITTED",
  "livekitToken": "eyJhbGciOiJIUzI1NiIs...",
  "resolvedAt": "2025-01-15T10:32:00Z"
}
```

---

## 4. Deny Participant (Host/Moderator Only)

```
POST /api/v1/meetings/{meetingId}/waiting-room/deny/{entryId}
```

### Request Body

```json
{
  "reason": "Unknown guest"
}
```

### Response (200 OK)

```json
{
  "entryId": "wr_entry_abc123",
  "status": "DENIED",
  "resolvedAt": "2025-01-15T10:33:00Z"
}
```

---

## 5. Admit All Waiting Participants (Host/Moderator Only)

```
POST /api/v1/meetings/{meetingId}/waiting-room/admit-all
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_xyz",
  "admittedCount": 12,
  "resolvedAt": "2025-01-15T10:35:00Z"
}
```

---

# WebSocket Events (Real-Time)

Host/moderators receive updates via these WebSocket event names:

| Event | Schema Description |
|-------|--------------------|
| `WAITING_ROOM_KNOCKED` | Details of the participant requesting access. |
| `WAITING_ROOM_UPDATED` | List updates. |

Waiting participants receive updates on their individual channel:

| Event | Schema Description |
|-------|--------------------|
| `LOBBY_ADMITTED` | Contains the LiveKit access token to connect to the meeting. |
| `LOBBY_DENIED` | Notifies user they have been denied, closes websocket. |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 403 | INSUFFICIENT_ROLE | Requester is not a host or moderator |
| 404 | ENTRY_NOT_FOUND | Waiting room entry does not exist |
| 409 | ALREADY_RESOLVED | The entry has already been admitted or denied |

---

End of Document
