# feature-meeting/shared/API.md

Document ID: SHARED-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Shared Kernel & Cross-Cutting Concerns

Subdomain: feature-meeting/shared

---

# Overview

The `shared` subdomain does not expose its own REST API endpoints directly.

However, it defines the **standard API conventions**, **error response schemas**, and **common HTTP status codes** that all `feature-meeting` subdomains MUST follow.

---

# 1. Standard Response Formats

## 1.1 Success Response

```json
{
  "data": { ... },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

## 1.2 Paginated Response

```json
{
  "data": {
    "items": [ ... ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 150
  },
  "meta": {
    "timestamp": "2025-01-15T10:30:00Z"
  }
}
```

## 1.3 Error Response

```json
{
  "error": {
    "code": "MEETING_NOT_FOUND",
    "message": "The requested meeting does not exist.",
    "timestamp": "2025-01-15T10:30:00Z",
    "traceId": "trace-abc-123"
  }
}
```

---

# 2. Standard HTTP Status Codes

| Status | When to Use |
|--------|-------------|
| `200 OK` | Successful read or update operation |
| `201 Created` | Successful resource creation |
| `204 No Content` | Successful delete with no response body |
| `400 Bad Request` | Validation error or invalid request format |
| `401 Unauthorized` | Missing or invalid authentication token |
| `403 Forbidden` | Authenticated but insufficient permissions |
| `404 Not Found` | Resource does not exist |
| `409 Conflict` | State conflict (e.g. room already locked) |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server failure |

---

# 3. Standard Error Codes

| Code | Subdomain | Description |
|------|-----------|-------------|
| `MEETING_NOT_FOUND` | All | Meeting ID not found |
| `MEETING_ALREADY_ENDED` | lifecycle | Meeting has ended |
| `PARTICIPANT_NOT_FOUND` | participants | Participant not found |
| `INSUFFICIENT_ROLE` | permissions | Action requires higher role |
| `PERMISSION_DENIED` | permissions | Specific permission flag denied |
| `ROOM_ALREADY_LOCKED` | room | Room locked, can't re-lock |
| `INVITATION_NOT_FOUND` | invitations | Token does not match any invitation |
| `INVITATION_EXPIRED` | invitations | Token is past expiration time |
| `INVALID_START_TIME` | scheduling | Start time is in the past |
| `INVALID_TIMEZONE` | scheduling | Unknown IANA timezone string |
| `ENTRY_NOT_FOUND` | waiting-room | Waiting room entry not found |
| `ALREADY_RESOLVED` | waiting-room | Entry already admitted or denied |

---

# 4. Authentication Header Convention

All API endpoints MUST require the following header:

```
Authorization: Bearer <JWT_TOKEN>
```

Exception: Public RSVP endpoints (`/api/v1/invitations/rsvp`, `/api/v1/invitations/details`) are unauthenticated but require a valid invitation token in the body.

---

End of Document
