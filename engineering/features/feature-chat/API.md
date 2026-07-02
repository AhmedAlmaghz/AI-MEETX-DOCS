# feature-chat/API.md
Document ID: CHAT-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Chat

Priority: P1

Owner: Platform Architecture Team

Classification: Mandatory

---

# 1. Purpose

Defines Rest APIs and WebSocket subscription topics for meeting text channels.

---

# 2. Endpoints

## Base URL
`/api/v1/chat`

---

## API-CHAT-001: Get Chat History

**Method:** GET

**URL:** `/api/v1/chat/{meetingId}`

**Response 200:**
```json
{
  "messages": [
    {
      "id": "message-uuid",
      "senderId": "user-uuid",
      "text": "Hello team!",
      "created_at": "2026-07-02T10:10:00Z"
    }
  ]
}
```

---

End of Document