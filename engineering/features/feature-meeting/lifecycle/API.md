# engineering/features/feature-meeting/lifecycle/API.md

Document ID: MEETING-LIFECYCLE-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

---

# Purpose

Defines the public API contracts for managing the lifecycle of meetings.

This document follows the Platform API Standards.

---

# Base Path

/api/v1/meetings

Authorization

Bearer Token Required

---

# Resource

Meeting

Primary Identifier

meetingId (UUID)

---

# Endpoints

## Create Meeting

POST /

Creates a new meeting.

### Request

```json
{
  "title": "Architecture Review",
  "description": "Sprint 15 planning",
  "meetingType": "SCHEDULED",
  "schedule": {
    "startTime": "...",
    "endTime": "...",
    "timezone": "UTC"
  },
  "settings": {
    "waitingRoomEnabled": true,
    "recordingEnabled": false,
    "translationEnabled": true
  }
}
```

### Response

201 Created

Returns

MeetingDto

---

## Get Meeting

GET /{meetingId}

Returns

MeetingDto

---

## Update Meeting

PATCH /{meetingId}

Updates mutable meeting metadata.

Allowed Fields

- title
- description
- schedule
- settings

Meeting status SHALL NOT be updated through this endpoint.

---

## Start Meeting

POST /{meetingId}/start

Response

200 OK

State

Waiting → Active

---

## Pause Meeting

POST /{meetingId}/pause

Response

200 OK

State

Active → Paused

---

## Resume Meeting

POST /{meetingId}/resume

Response

200 OK

State

Paused → Active

---

## End Meeting

POST /{meetingId}/end

Response

200 OK

State

Active → Ended

---

## Cancel Meeting

POST /{meetingId}/cancel

Allowed

Scheduled meetings only.

---

## Archive Meeting

POST /{meetingId}/archive

Allowed

Ended meetings only.

---

## Restore Meeting

POST /{meetingId}/restore

Allowed

Archived meetings only.

---

## Delete Meeting

DELETE /{meetingId}

Soft Delete

Returns

204 No Content

---

## Search Meetings

GET /

Supported Query Parameters

ownerId

status

meetingType

from

to

page

pageSize

sort

---

# DTO

MeetingDto

```text
meetingId
ownerId
title
description
meetingType
meetingStatus
schedule
settings
createdAt
updatedAt
```

---

# Response Envelope

Successful responses SHALL use:

```json
{
  "data": {},
  "meta": {}
}
```

---

Errors SHALL use:

```json
{
  "error": {
    "code": "...",
    "message": "...",
    "correlationId": "..."
  }
}
```

---

# Idempotency

Supported

Create Meeting

Client SHALL send

Idempotency-Key

Repeated requests SHALL return the original meeting.

---

# Optimistic Concurrency

PATCH requests SHALL include

Version

or

ETag

Conflicting updates return

409 Conflict

---

# Pagination

Offset Pagination

Current Version

page

pageSize

Future

Cursor Pagination

---

# Filtering

Supported

Meeting Status

Meeting Type

Owner

Date Range

Tags

---

# Sorting

Supported

createdAt

startTime

updatedAt

title

---

# Validation

Title

Required

3–150 characters

Meeting Type

Required

Schedule

Required for scheduled meetings

Owner

Derived from authenticated user

---

# Error Codes

MEETING_NOT_FOUND

MEETING_ALREADY_ACTIVE

MEETING_ALREADY_ENDED

INVALID_TRANSITION

INVALID_SCHEDULE

UNAUTHORIZED_HOST

MEETING_ARCHIVED

MEETING_DELETED

CONFLICT

VALIDATION_ERROR

SERVER_ERROR

NETWORK_ERROR

---

# Retry Policy

GET

Automatic Retry

POST

No automatic retry

PATCH

Manual retry after conflict resolution

DELETE

No retry

---

# Audit

Every successful mutation SHALL produce:

Audit Record

Domain Event

Updated Timestamp

---

# Security

Only authorized hosts may mutate lifecycle.

Read access follows Meeting Visibility Policy.

Sensitive meeting settings SHALL NOT be exposed to unauthorized users.

---

# Completion Criteria

✓ REST contract implemented

✓ DTOs defined

✓ Validation implemented

✓ Error model implemented

✓ Optimistic concurrency supported

✓ Tests passing

---

End of Document