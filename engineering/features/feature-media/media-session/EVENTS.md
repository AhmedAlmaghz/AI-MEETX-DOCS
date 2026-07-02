# engineering/features/feature-media/media-session/EVENTS.md

Document ID: MEDIA-SESSION-EVT-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Session

---

# Purpose

Defines all domain events produced and consumed by the Media Session subdomain.

Media Session is the authoritative publisher of media session lifecycle events.

---

# Event Principles

All events SHALL:

- Be immutable
- Include eventId
- Include aggregateId
- Include meetingId
- Include participantId
- Include timestamp
- Include correlationId
- Include schemaVersion

---

# Aggregate

Aggregate Type

MediaSession

Aggregate Identifier

sessionId

---

# Produced Events

## MediaSessionCreatedEvent

Published after a media session is created.

Payload

```text
sessionId
meetingId
participantId
createdAt
```

Consumers

- Audio
- Video
- Screen Share
- Signaling
- Statistics

---

## MediaSessionInitializedEvent

Published after initialization succeeds.

Payload

```text
sessionId
initializedAt
capabilities
```

Consumers

- Audio
- Video
- Data Channel

---

## MediaSessionActivatedEvent

Published when media transport becomes active.

Payload

```text
sessionId
activatedAt
```

Consumers

- Audio
- Video
- Recording
- AI
- Translation

---

## MediaSessionPausedEvent

Payload

```text
sessionId
pausedAt
```

Consumers

- Audio
- Video
- Recording

---

## MediaSessionResumedEvent

Payload

```text
sessionId
resumedAt
```

Consumers

- Audio
- Video
- Recording

---

## MediaSessionRecoveringEvent

Payload

```text
sessionId
reason
startedAt
```

Consumers

- Network
- Statistics

---

## MediaSessionRecoveredEvent

Payload

```text
sessionId
recoveredAt
duration
```

Consumers

- Audio
- Video
- AI
- Translation

---

## MediaSessionClosedEvent

Payload

```text
sessionId
closedAt
reason
```

Consumers

- Audio
- Video
- Recording
- Statistics

---

# Consumed Events

## ParticipantJoinedEvent

Action

Create Media Session.

---

## ParticipantLeftEvent

Action

Close Media Session.

---

## MeetingEndedEvent

Action

Terminate all media sessions.

---

## NetworkRecoveredEvent

Action

Attempt session recovery.

---

## DeviceChangedEvent

Action

Reconfigure session if required.

---

# Event Ordering

ParticipantJoinedEvent

↓

MediaSessionCreatedEvent

↓

MediaSessionInitializedEvent

↓

MediaSessionActivatedEvent

↓

MediaSessionPausedEvent*

↓

MediaSessionResumedEvent*

↓

MediaSessionClosedEvent

(*) Optional

---

# Delivery Guarantees

Delivery

At Least Once

Consumers SHALL be idempotent.

Duplicate events SHALL NOT produce duplicate media sessions.

---

# Metadata

Required

```text
eventId

aggregateId

meetingId

participantId

aggregateVersion

timestamp

correlationId

producer

schemaVersion
```

---

# Failure Policy

If publication fails

Persist

↓

Retry

↓

Alert

Media Session state SHALL remain committed.

---

# Security

Events SHALL NOT expose

- ICE Candidates
- SDP
- Encryption Keys
- Internal Network Addresses

Infrastructure-specific data SHALL remain internal.

---

# Observability

Metrics

media_sessions_created_total

media_sessions_active

media_sessions_recovered

media_sessions_closed

media_session_recovery_duration

---

# Completion Criteria

✓ Events implemented

✓ Event Bus integrated

✓ Metadata verified

✓ Security verified

✓ Metrics integrated

---

End of Document