# feature-meeting/scheduling/EVENTS.md

Document ID: SCHEDULING-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Scheduling & Calendar

Subdomain: feature-meeting/scheduling

---

# Overview

Defines domain events published and consumed for meeting bookings, rescheduling, series cancellations, and reminders.

---

# Events Published

---

## MeetingScheduledEvent

Published when a meeting is booked. For recurring series, this event is published for each generated occurrence.

```yaml
Event: MeetingScheduledEvent

Schema:
  eventId: string
  scheduleId: string
  meetingId: string
  title: string
  description: string | null
  startTime: ISO8601
  durationMinutes: integer
  timezoneId: string
  seriesId: string | null
  creatorId: string                     # UserId of creator
  scheduledAt: ISO8601

Routing:
  topic: meeting.scheduling.scheduled
  partitionKey: scheduleId
```

---

## MeetingRescheduledEvent

Published when an occurrence start time or duration is changed.

```yaml
Event: MeetingRescheduledEvent

Schema:
  eventId: string
  scheduleId: string
  meetingId: string
  previousStartTime: ISO8601
  newStartTime: ISO8601
  previousDurationMinutes: integer
  newDurationMinutes: integer
  rescheduledBy: string                 # ParticipantId/UserId
  rescheduledAt: ISO8601

Routing:
  topic: meeting.scheduling.rescheduled
  partitionKey: scheduleId

Side Effects:
  - Notification Feature: triggers update email/push to invitees.
```

---

## MeetingCancelledEvent

Published when a scheduled meeting is cancelled.

```yaml
Event: MeetingCancelledEvent

Schema:
  eventId: string
  scheduleId: string
  meetingId: string
  title: string
  cancelledBy: string
  reason: string | null
  cancelledAt: ISO8601

Routing:
  topic: meeting.scheduling.cancelled
  partitionKey: scheduleId

Side Effects:
  - Notification Feature: triggers cancellation email/push to invitees.
  - Invitations Feature: revokes outstanding tokens for this meeting.
```

---

## MeetingReminderTriggeredEvent

Published when a reminder scheduler matches a trigger time.

```yaml
Event: MeetingReminderTriggeredEvent

Schema:
  eventId: string
  scheduleId: string
  meetingId: string
  title: string
  channel: enum [PUSH, EMAIL, SMS]
  triggerOffsetMinutes: integer
  triggeredAt: ISO8601

Routing:
  topic: meeting.scheduling.reminder_triggered
  partitionKey: scheduleId

Side Effects:
  - Notification Feature: delivers the notification to all RSVP-accepted invitees.
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | Mark schedule record status as `COMPLETED`. |

---

End of Document
