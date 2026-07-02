# feature-notification/API.md

Document ID: NOTIF-API-001

Version: 1.0.0

Status: Approved

Feature: Notification System

Base Path: /api/v1/notifications

---

## 1. Get Notification History

```
GET /api/v1/notifications
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | integer | 1 | Page number |
| pageSize | integer | 20 | Items per page |
| type | string | - | Filter by NotificationType |

### Response (200 OK)

```json
{
  "items": [
    {
      "id": "notif_001",
      "type": "MEETING_REMINDER",
      "channel": "PUSH",
      "title": "Meeting starts in 15 minutes",
      "status": "SENT",
      "sentAt": "2025-01-15T09:45:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 42
}
```

---

## 2. Get Notification Preferences

```
GET /api/v1/notifications/preferences
```

### Response (200 OK)

```json
{
  "preferences": {
    "MEETING_REMINDER": ["PUSH", "EMAIL"],
    "RECORDING_READY": ["EMAIL"],
    "MEETING_INVITATION": ["EMAIL"],
    "MEETING_STARTED": ["PUSH"]
  }
}
```

---

## 3. Update Notification Preferences

```
PUT /api/v1/notifications/preferences
```

### Request Body

```json
{
  "preferences": {
    "MEETING_REMINDER": ["PUSH"],
    "RECORDING_READY": ["PUSH", "EMAIL"],
    "MEETING_INVITATION": ["EMAIL"],
    "MEETING_STARTED": []
  }
}
```

### Response (200 OK)

```json
{
  "preferences": {
    "MEETING_REMINDER": ["PUSH"],
    "RECORDING_READY": ["PUSH", "EMAIL"]
  },
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

## 4. Register Device Token (Push)

```
POST /api/v1/notifications/devices
```

### Request Body

```json
{
  "platform": "FCM",
  "token": "fcm_device_token_string_here"
}
```

### Response (200 OK)

```json
{
  "deviceId": "dev_abc123",
  "platform": "FCM",
  "registeredAt": "2025-01-15T10:05:00Z"
}
```

---

## 5. Deregister Device Token

```
DELETE /api/v1/notifications/devices/{deviceId}
```

### Response (204 No Content)

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_TOKEN | Device token format is invalid |
| 429 | NOTIFICATION_RATE_LIMIT | Too many notification requests |

---

End of Document
