# feature-meeting/invitations/API.md

Document ID: INVITATIONS-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Invitations & RSVP

Base Path: /api/v1/meetings/{meetingId}/invitations

---

# Overview

Provides REST endpoints to create, list, and manage email invitations, set passcodes, and process RSVP updates.

---

# Endpoints

---

## 1. Bulk Create Invitations (Host/Co-Host Only)

Sends email invitations to a list of invitees and generates RSVP tokens.

```
POST /api/v1/meetings/{meetingId}/invitations
```

### Request Body

```json
{
  "invitees": [
    {
      "email": "sarah@example.com",
      "name": "Sarah Connor",
      "role": "SPEAKER"
    },
    {
      "email": "john@example.com",
      "name": "John Connor",
      "role": "ATTENDEE"
    }
  ],
  "lifespanHours": 48
}
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "createdCount": 2,
  "invitations": [
    {
      "invitationId": "inv_1",
      "email": "sarah@example.com",
      "role": "SPEAKER",
      "token": "tok_secure_string_sarah_123456789...",
      "status": "PENDING",
      "expiresAt": "2025-01-17T10:30:00Z"
    },
    {
      "invitationId": "inv_2",
      "email": "john@example.com",
      "role": "ATTENDEE",
      "token": "tok_secure_string_john_123456789...",
      "status": "PENDING",
      "expiresAt": "2025-01-17T10:30:00Z"
    }
  ]
}
```

---

## 2. Get Invitations List (Host/Co-Host Only)

```
GET /api/v1/meetings/{meetingId}/invitations
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "totalSent": 2,
  "rsvpSummary": {
    "PENDING": 1,
    "ACCEPTED": 1,
    "DECLINED": 0,
    "EXPIRED": 0
  },
  "invitations": [
    {
      "invitationId": "inv_1",
      "email": "sarah@example.com",
      "name": "Sarah Connor",
      "role": "SPEAKER",
      "status": "ACCEPTED",
      "respondedAt": "2025-01-15T11:00:00Z"
    }
  ]
}
```

---

## 3. Revoke Invitation (Host/Co-Host Only)

```
DELETE /api/v1/meetings/{meetingId}/invitations/{invitationId}
```

### Response (200 OK)

```json
{
  "invitationId": "inv_2",
  "status": "REVOKED",
  "revokedAt": "2025-01-15T11:30:00Z"
}
```

---

## 4. Set Meeting Passcode (Host/Co-Host Only)

```
POST /api/v1/meetings/{meetingId}/invitations/passcode
```

### Request Body

```json
{
  "passcode": "SecretPass123",
  "isEnabled": true
}
```

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "isPasscodeEnabled": true,
  "updatedAt": "2025-01-15T11:35:00Z"
}
```

---

## 5. RSVP Response (Public/Unauthenticated)

Used by invitees clicking the direct RSVP links in their emails.

```
POST /api/v1/invitations/rsvp
```

### Request Body

```json
{
  "token": "tok_secure_string_sarah_123456789...",
  "status": "ACCEPTED"
}
```

### Response (200 OK)

```json
{
  "invitationId": "inv_1",
  "meetingId": "meeting_abc123",
  "inviteeEmail": "sarah@example.com",
  "status": "ACCEPTED",
  "respondedAt": "2025-01-15T11:00:00Z"
}
```

---

## 6. Get Invitation Details by Token (Public/Unauthenticated)

Used by the frontend to render the RSVP landing page.

```
GET /api/v1/invitations/details
```

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | The secure invitation token |

### Response (200 OK)

```json
{
  "meetingId": "meeting_abc123",
  "meetingTitle": "Weekly Strategy Sync",
  "inviteeEmail": "sarah@example.com",
  "inviteeName": "Sarah Connor",
  "inviteeRole": "SPEAKER",
  "startTime": "2025-01-18T10:00:00Z",
  "status": "PENDING"
}
```

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_TOKEN | The provided invitation token is invalid or does not exist. |
| 403 | TOKEN_EXPIRED | The invitation token has expired. |
| 403 | PASSCODE_REQUIRED | The meeting requires a passcode but none was provided. |
| 403 | INVALID_PASSCODE | The provided passcode is incorrect. |

---

End of Document
