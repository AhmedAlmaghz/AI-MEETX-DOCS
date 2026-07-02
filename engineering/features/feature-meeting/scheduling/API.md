# feature-meeting/scheduling/API.md

Document ID: SCHEDULING-API-001

Version: 1.0.0

Status: Approved

Feature: Meeting Scheduling & Calendar

Base Path: /api/v1/meetings/schedule

---

# Overview

Provides REST endpoints to book scheduled meetings, modify scheduled times, cancel events, and export calendar links.

---

# Endpoints

---

## 1. Schedule a Meeting

Book a meeting in advance, optionally setting up a recurrence rule.

```
POST /api/v1/meetings/schedule
```

### Request Body

```json
{
  "title": "Monthly Marketing Review",
  "description": "Aligning on monthly goals",
  "startTime": "2025-02-01T10:00:00Z",
  "durationMinutes": 60,
  "timezoneId": "Asia/Riyadh",
  "recurrenceRule": {
    "frequency": "MONTHLY",
    "interval": 1,
    "count": 6
  },
  "reminderSettings": [
    {
      "triggerOffsetMinutes": 15,
      "channel": "PUSH"
    },
    {
      "triggerOffsetMinutes": 60,
      "channel": "EMAIL"
    }
  ]
}
```

### Response (200 OK)

```json
{
  "scheduleId": "sch_123456",
  "meetingId": "meeting_abc123",
  "title": "Monthly Marketing Review",
  "startTime": "2025-02-01T10:00:00Z",
  "durationMinutes": 60,
  "timezoneId": "Asia/Riyadh",
  "seriesId": "ser_789012",
  "status": "SCHEDULED"
}
```

---

## 2. Get Schedule Details

```
GET /api/v1/meetings/schedule/{scheduleId}
```

### Response (200 OK)

```json
{
  "scheduleId": "sch_123456",
  "meetingId": "meeting_abc123",
  "title": "Monthly Marketing Review",
  "description": "Aligning on monthly goals",
  "startTime": "2025-02-01T10:00:00Z",
  "durationMinutes": 60,
  "timezoneId": "Asia/Riyadh",
  "seriesId": "ser_789012",
  "status": "SCHEDULED",
  "reminderSettings": [
    { "triggerOffsetMinutes": 15, "channel": "PUSH" }
  ]
}
```

---

## 3. Edit Schedule Occurrence (Single instance)

```
PUT /api/v1/meetings/schedule/{scheduleId}
```

### Request Body

```json
{
  "startTime": "2025-02-01T11:30:00Z",
  "durationMinutes": 45
}
```

### Response (200 OK)

```json
{
  "scheduleId": "sch_123456",
  "startTime": "2025-02-01T11:30:00Z",
  "durationMinutes": 45,
  "status": "SCHEDULED",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

---

## 4. Edit Recurrence Series (All upcoming instances)

```
PUT /api/v1/meetings/schedule/series/{seriesId}
```

### Request Body

```json
{
  "title": "Updated Marketing Review Sync",
  "durationMinutes": 90
}
```

### Response (200 OK)

```json
{
  "seriesId": "ser_789012",
  "updatedOccurrencesCount": 5,
  "title": "Updated Marketing Review Sync",
  "durationMinutes": 90,
  "updatedAt": "2025-01-15T11:05:00Z"
}
```

---

## 5. Cancel Schedule (Single or Series)

```
DELETE /api/v1/meetings/schedule/{scheduleId}
```

### Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| cancelSeries | boolean | No | If true, cancels the entire recurrence series (default: false) |

### Response (200 OK)

```json
{
  "scheduleId": "sch_123456",
  "status": "CANCELLED",
  "cancelledAt": "2025-01-15T11:10:00Z"
}
```

---

## 6. Export Calendar File (iCal format)

Returns an `.ics` raw text document.

```
GET /api/v1/meetings/schedule/{scheduleId}/ics
```

### Response (200 OK)

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI MEETX//Scheduling//EN
BEGIN:VEVENT
UID:sch_123456
DTSTART:20250201T100000Z
DTEND:20250201T110000Z
SUMMARY:Monthly Marketing Review
DESCRIPTION:Aligning on monthly goals
END:VEVENT
END:VCALENDAR
```

---

## 7. List Upcoming Schedules for User

Lists scheduled meetings for the authenticated user.

```
GET /api/v1/meetings/schedule
```

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | integer | 20 | Number of results |
| fromTime | string | NOW | ISO8601 start time threshold |

### Response (200 OK)

```json
{
  "schedules": [
    {
      "scheduleId": "sch_123456",
      "title": "Monthly Marketing Review",
      "startTime": "2025-02-01T10:00:00Z",
      "durationMinutes": 60,
      "status": "SCHEDULED"
    }
  ]
}
```

---

# Error Reference

| Code | Error | Description |
|------|-------|-------------|
| 400 | INVALID_START_TIME | The start time must be in the future. |
| 400 | INVALID_TIMEZONE | Timezone string does not match IANA list. |
| 404 | SCHEDULE_NOT_FOUND | The specified scheduleId does not exist. |

---

End of Document
