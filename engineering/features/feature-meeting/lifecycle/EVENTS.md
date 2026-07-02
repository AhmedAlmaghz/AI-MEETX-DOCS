# engineering/features/feature-meeting/lifecycle/EVENTS.md

Document ID: MEETING-LIFECYCLE-EVT-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

---

# Purpose

Defines all domain events produced and consumed by the Meeting Lifecycle subdomain.

Meeting Lifecycle is the authoritative publisher of all meeting state transitions.

---

# Event Principles

All lifecycle events SHALL:

- Be immutable
- Include aggregateId
- Include eventId
- Include correlationId
- Include timestamp
- Include version

---

# Aggregate Identifier

aggregateType

Meeting

aggregateId

meetingId

---

# Produced Events

## MeetingCreatedEvent

Published after successful meeting creation.

Payload

```text
meetingId
ownerId
meetingType
createdAt
```

Consumers

- Participants
- Scheduling
- Analytics
- Notifications

---

## MeetingScheduledEvent

Published when a scheduled meeting becomes available.

Payload

```text
meetingId
startTime
timezone
```

Consumers

- Scheduler
- Notification
- Calendar

---

## MeetingStartedEvent

Published when meeting enters Active state.

Payload

```text
meetingId
ownerId
startedAt
```

Consumers

- Participants
- Media
- Chat
- Translation
- AI
- Recording
- Analytics

---

## MeetingPausedEvent

Payload

```text
meetingId
pausedAt
```

Consumers

- Media
- Recording
- Analytics

---

## MeetingResumedEvent

Payload

```text
meetingId
resumedAt
```

Consumers

- Media
- Recording

---

## MeetingEndedEvent

Payload

```text
meetingId
endedAt
duration
```

Consumers

- Recording
- Chat
- AI
- Analytics
- Notifications

---

## MeetingArchivedEvent

Payload

```text
meetingId
archivedAt
```

Consumers

- Search
- Analytics

---

## MeetingDeletedEvent

Payload

```text
meetingId
deletedAt
```

Consumers

- Search
- Storage
- Analytics

---

## MeetingCancelledEvent

Payload

```text
meetingId
cancelledAt
reason
```

Consumers

- Notifications
- Calendar
- Participants

---

# Consumed Events

## UserAuthenticatedEvent

Purpose

Authorize lifecycle actions.

---

## NetworkAvailableEvent

Purpose

Retry pending synchronization.

---

## ApplicationStartedEvent

Purpose

Restore active meeting context.

---

# Event Ordering

Create

↓

Schedule

↓

Waiting

↓

Start

↓

Pause*

↓

Resume*

↓

End

↓

Archive

↓

Delete

(*) Optional

---

# Delivery Guarantees

Delivery

At Least Once

Consumers SHALL be idempotent.

Duplicate events SHALL NOT produce duplicate state.

---

# Correlation

Each lifecycle command SHALL generate:

CorrelationId

Used across:

- Logs
- Metrics
- Tracing
- Audit

---

# Event Metadata

Required Metadata

```text
eventId

aggregateId

aggregateVersion

timestamp

correlationId

producer

schemaVersion
```

---

# Failure Policy

If publishing fails

Persist event

↓

Retry asynchronously

↓

Alert if retries exhausted

Meeting state SHALL NOT roll back because of event delivery failure.

---

# Security

Events SHALL NOT expose:

Meeting password

Internal tokens

Secrets

Private metadata

---

# Observability

Metrics

meeting_created_total

meeting_started_total

meeting_ended_total

meeting_duration

meeting_failures

meeting_cancellations

---

# Completion Criteria

✓ All lifecycle events implemented

✓ Event Bus integration complete

✓ Metadata included

✓ Idempotency verified

✓ Observability integrated

---

End of Document