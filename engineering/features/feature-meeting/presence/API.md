# feature-meeting/presence/API.md

Document ID: PRESENCE-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Presence Tracking & Active Speakers

Base Path: /api/v1/meetings/{meetingId}/presence

---

# Overview

Provides REST endpoints for client heartbeats and presence queries, alongside real-time WebSocket channels for active speaker and connection state updates.

---

# Endpoints

---

## 1. Send Heartbeat

Sent by the client every 5 seconds to keep the presence record alive.

```
POST /api/v1/meetings/{meetingId}/presence/heartbeat
```

### Response (200 OK)

```json
{
  "participantId": "par_user_123",
  "connectionState": "CONNECTED",
  "lastHeartbeatAt": "2025-01-15T10:30:00Z"
}
```

---

## 2. Get All Presence in a Meeting

Returns all participants and their current connection and speaking states.

```
GET /api/v1/meetings/{meetingId}/presence
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "participants": [
    {
      "participantId": "par_host_001",
      "connectionState": "CONNECTED",
      "networkQuality": "EXCELLENT",
      "isSpeaking": true,
      "audioLevel": 0.82
    },
    {
      "participantId": "par_user_002",
      "connectionState": "CONNECTED",
      "networkQuality": "GOOD",
      "isSpeaking": false,
      "audioLevel": 0.0
    }
  ]
}
```

---

## 3. Get Active Speaker

Returns the participant currently speaking with the highest audio level.

```
GET /api/v1/meetings/{meetingId}/presence/active-speaker
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "activeSpeakerId": "par_host_001",
  "audioLevel": 0.82,
  "detectedAt": "2025-01-15T10:31:00Z"
}
```

---

## 4. Update Network Quality (Client-Reported)

Client reports its local WebRTC stats.

```
POST /api/v1/meetings/{meetingId}/presence/network-quality
```

### Request Body

```json
{
  "networkQuality": "FAIR",
  "packetLossPercent": 3.2,
  "latencyMs": 210
}
```

### Response (200 OK)

```json
{
  "participantId": "par_user_002",
  "networkQuality": "FAIR",
  "updatedAt": "2025-01-15T10:32:00Z"
}
```

---

# WebSocket Events (Real-Time)

All participants in a meeting receive the following events via the meeting WebSocket channel:

| Event | Schema |
|-------|--------|
| `PRESENCE_CHANGED` | `{ participantId, connectionState, networkQuality, timestamp }` |
| `ACTIVE_SPEAKER_CHANGED` | `{ previousSpeakerId, newSpeakerId, audioLevel, timestamp }` |
| `PARTICIPANT_RECONNECTED` | `{ participantId, reconnectedAt }` |
| `PARTICIPANT_DISCONNECTED` | `{ participantId, disconnectedAt }` |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 404 | PARTICIPANT_NOT_FOUND | The participant is not active in this meeting |
| 404 | NO_ACTIVE_SPEAKER | No speaker is currently active |

---

End of Document
