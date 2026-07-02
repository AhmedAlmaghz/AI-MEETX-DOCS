# feature-recording/API.md

Document ID: RECORDING-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Recording

Base Path: /api/v1/meetings/{meetingId}/recordings

---

## 1. Start Recording

```
POST /api/v1/meetings/{meetingId}/recordings/start
```

### Request Body

```json
{
  "layout": "SPEAKER_VIEW"
}
```

### Response (200 OK)

```json
{
  "recordingId": "rec_abc123",
  "meetingId": "meeting_xyz",
  "layout": "SPEAKER_VIEW",
  "status": "STARTING",
  "startedAt": "2025-01-15T10:30:00Z"
}
```

---

## 2. Stop Recording

```
POST /api/v1/meetings/{meetingId}/recordings/{recordingId}/stop
```

### Response (200 OK)

```json
{
  "recordingId": "rec_abc123",
  "status": "STOPPING",
  "stoppedAt": "2025-01-15T11:00:00Z"
}
```

---

## 3. List Recordings for Meeting

```
GET /api/v1/meetings/{meetingId}/recordings
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_xyz",
  "recordings": [
    {
      "recordingId": "rec_abc123",
      "layout": "SPEAKER_VIEW",
      "status": "READY",
      "fileSizeBytes": 256000000,
      "durationSeconds": 3600,
      "expiresAt": "2025-02-15T10:30:00Z"
    }
  ]
}
```

---

## 4. Get Download Link

Generates a signed temporary download URL.

```
GET /api/v1/meetings/{meetingId}/recordings/{recordingId}/download
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| expiresInHours | integer | 24 | Link expiration (max 72) |

### Response (200 OK)

```json
{
  "recordingId": "rec_abc123",
  "downloadUrl": "https://storage.example.com/signed?token=...",
  "expiresAt": "2025-01-16T10:30:00Z"
}
```

---

# WebSocket Events

| Event | Description |
|-------|-------------|
| `RECORDING_STARTED` | Broadcast to all participants when recording begins |
| `RECORDING_STOPPED` | Broadcast when recording is stopped |
| `RECORDING_READY` | Broadcast to host/co-host when file is available |

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 403 | INSUFFICIENT_ROLE | Only HOST/CO_HOST can manage recordings |
| 409 | RECORDING_ALREADY_ACTIVE | A recording is already in progress |
| 404 | RECORDING_NOT_FOUND | Recording ID not found |
| 503 | EGRESS_UNAVAILABLE | LiveKit Egress service unavailable |

---

End of Document
