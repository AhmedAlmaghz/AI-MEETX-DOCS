# feature-meeting/permissions/API.md

Document ID: PERMISSIONS-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Permissions & Role-Based Access Control

Base Path: /api/v1/meetings/{meetingId}/permissions

---

# Overview

Provides endpoints to manage global meeting locks, waiting room bypass policies, granular participant permission overrides, and hand-raising state.

---

# Endpoints

---

## 1. Get Global Meeting Permissions

```
GET /api/v1/meetings/{meetingId}/permissions
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "lockAttendeeAudio": false,
  "lockAttendeeVideo": false,
  "lockAttendeeChat": false,
  "allowAttendeeScreenShare": false,
  "waitingRoomPolicy": "AUTHENTICATED_USERS",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

---

## 2. Update Global Meeting Permissions (Host/Co-Host Only)

```
PUT /api/v1/meetings/{meetingId}/permissions
```

### Request Body

```json
{
  "lockAttendeeAudio": true,
  "lockAttendeeVideo": false,
  "lockAttendeeChat": true,
  "allowAttendeeScreenShare": false,
  "waitingRoomPolicy": "INVITED_GUESTS"
}
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "lockAttendeeAudio": true,
  "lockAttendeeVideo": false,
  "lockAttendeeChat": true,
  "allowAttendeeScreenShare": false,
  "waitingRoomPolicy": "INVITED_GUESTS",
  "updatedBy": "par_host_123",
  "updatedAt": "2025-01-15T10:45:00Z"
}
```

---

## 3. Override Participant Permissions (Host/Moderator Only)

```
POST /api/v1/meetings/{meetingId}/permissions/overrides/{participantId}
```

### Request Body

```json
{
  "allowedPermissions": ["PUBLISH_AUDIO", "PUBLISH_VIDEO"],
  "deniedPermissions": ["SEND_CHAT"]
}
```

### Response (200 OK)

```json
{
  "participantId": "par_user_456",
  "allowedPermissions": ["PUBLISH_AUDIO", "PUBLISH_VIDEO"],
  "deniedPermissions": ["SEND_CHAT"],
  "updatedAt": "2025-01-15T10:50:00Z"
}
```

---

## 4. Raise Hand (Attendee only)

```
POST /api/v1/meetings/{meetingId}/permissions/raise-hand
```

### Response (200 OK)

```json
{
  "participantId": "par_user_456",
  "isHandRaised": true,
  "handRaisedAt": "2025-01-15T10:55:00Z"
}
```

---

## 5. Lower Hand (Host/Moderator, or Self)

```
POST /api/v1/meetings/{meetingId}/permissions/lower-hand/{participantId}
```

### Response (200 OK)

```json
{
  "participantId": "par_user_456",
  "isHandRaised": false,
  "loweredAt": "2025-01-15T10:56:00Z"
}
```

---

## 6. Grant Speak Permission (Host/Moderator Only)

Directly overrides the attendee audio lock to let the participant speak.

```
POST /api/v1/meetings/{meetingId}/permissions/speak-requests/{participantId}/grant
```

### Response (200 OK)

```json
{
  "participantId": "par_user_456",
  "speakPermissionGranted": true,
  "allowedPermissions": ["PUBLISH_AUDIO"],
  "grantedAt": "2025-01-15T10:57:00Z"
}
```

---

## 7. Revoke Speak Permission (Host/Moderator Only)

```
POST /api/v1/meetings/{meetingId}/permissions/speak-requests/{participantId}/revoke
```

### Response (200 OK)

```json
{
  "participantId": "par_user_456",
  "speakPermissionGranted": false,
  "revokedAt": "2025-01-15T10:58:00Z"
}
```

---

## 8. Get Raised Hands List

```
GET /api/v1/meetings/{meetingId}/permissions/hand-raises
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "handRaises": [
    {
      "participantId": "par_user_456",
      "displayName": "Sarah Connor",
      "handRaisedAt": "2025-01-15T10:55:00Z"
    }
  ]
}
```

---

# WebSocket Events (Real-Time)

| Event | Target | Description |
|-------|--------|-------------|
| `GLOBAL_PERMISSIONS_CHANGED` | Room | Sent when meeting locks/policies update |
| `PARTICIPANT_PERMISSIONS_UPDATED` | Individual/Room | Override details update |
| `HAND_RAISED` | Room | Attendee raises hand |
| `HAND_LOWERED` | Room | Hand lowered |
| `SPEAK_PERMISSION_GRANTED` | Individual | Participant receives temporary speaking status |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 403 | INSUFFICIENT_ROLE | Requires HOST/CO_HOST/MODERATOR |
| 404 | PARTICIPANT_NOT_FOUND | Target participant is not active |
| 409 | ALREADY_GRANTED | Permission override already exists |

---

End of Document
