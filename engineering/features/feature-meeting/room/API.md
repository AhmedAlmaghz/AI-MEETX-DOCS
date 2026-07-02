# feature-meeting/room/API.md

Document ID: ROOM-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Room Management

Base Path: /api/v1/meetings/{meetingId}/room

---

# Overview

The Room API provides endpoints for host-level room control.

Real-time media (audio/video tracks) is managed entirely through the LiveKit SDK on the client side. This API handles only the configuration and control-plane operations.

---

# Authentication

All endpoints require:
- Header: `Authorization: Bearer <jwt_token>`
- The requesting user must be HOST or CO_HOST (except GET endpoints).

---

# Endpoints

---

## 1. Get Room Status

```
GET /api/v1/meetings/{meetingId}/room
```

### Response (200 OK)

```json
{
  "roomId": "room_abc123",
  "meetingId": "meeting_xyz",
  "livekitRoomName": "meeting_meeting_xyz",
  "status": "ACTIVE",
  "settings": {
    "maxParticipants": 100,
    "isLocked": false,
    "isMuteAllEnabled": false,
    "isVideoDisabled": false,
    "allowMultipleScreenShares": false,
    "maxVideoBitrateKbps": 2500,
    "audioQuality": "STANDARD"
  },
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

## 2. Lock Room (Host/Co-Host Only)

Prevent new participants from joining.

```
POST /api/v1/meetings/{meetingId}/room/lock
```

### Response (200 OK)

```json
{
  "status": "LOCKED",
  "lockedAt": "2025-01-15T10:30:00Z",
  "lockedBy": "par_host_123"
}
```

---

## 3. Unlock Room (Host/Co-Host Only)

```
POST /api/v1/meetings/{meetingId}/room/unlock
```

### Response (200 OK)

```json
{
  "status": "ACTIVE",
  "unlockedAt": "2025-01-15T10:35:00Z"
}
```

---

## 4. Mute All Participants (Host/Co-Host Only)

Mutes all participants' audio tracks.

Participants can unmute themselves unless "hard mute" is enabled.

```
POST /api/v1/meetings/{meetingId}/room/mute-all
```

### Response (200 OK)

```json
{
  "mutedCount": 47,
  "mutedAt": "2025-01-15T10:40:00Z",
  "mutedBy": "par_host_123"
}
```

---

## 5. Disable All Video (Host/Co-Host Only)

Stops all video tracks in the room to reduce bandwidth.

```
POST /api/v1/meetings/{meetingId}/room/disable-video
```

### Response (200 OK)

```json
{
  "isVideoDisabled": true,
  "disabledAt": "2025-01-15T10:45:00Z"
}
```

---

## 6. Enable All Video (Host/Co-Host Only)

Re-enables video publishing for all participants.

```
POST /api/v1/meetings/{meetingId}/room/enable-video
```

### Response (200 OK)

```json
{
  "isVideoDisabled": false,
  "enabledAt": "2025-01-15T10:50:00Z"
}
```

---

## 7. Update Room Settings (Host/Co-Host Only)

```
PATCH /api/v1/meetings/{meetingId}/room/settings
```

### Request Body

```json
{
  "maxParticipants": 200,
  "allowMultipleScreenShares": true,
  "audioQuality": "HIGH"
}
```

### Response (200 OK)

```json
{
  "settings": {
    "maxParticipants": 200,
    "allowMultipleScreenShares": true,
    "audioQuality": "HIGH"
  },
  "updatedAt": "2025-01-15T10:55:00Z"
}
```

---

# Real-Time Room Events (WebSocket)

| Event | Trigger |
|-------|---------|
| `ROOM_LOCKED` | Host locks room |
| `ROOM_UNLOCKED` | Host unlocks room |
| `ROOM_MUTE_ALL` | Host mutes all |
| `ROOM_VIDEO_DISABLED` | Host disables video |
| `ROOM_VIDEO_ENABLED` | Host enables video |
| `ROOM_SETTINGS_CHANGED` | Any room setting update |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 403 | INSUFFICIENT_ROLE | Only HOST or CO_HOST may perform this action |
| 404 | ROOM_NOT_FOUND | No room found for this meeting |
| 409 | ROOM_ALREADY_LOCKED | Room is already locked |
| 422 | ROOM_ENDED | Cannot modify a room that has ended |

---

End of Document
