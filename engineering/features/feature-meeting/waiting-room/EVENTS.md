# feature-meeting/waiting-room/EVENTS.md

Document ID: WAITING-ROOM-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Waiting Room / Lobby Management

Subdomain: feature-meeting/waiting-room

---

# Overview

Defines domain events published and consumed for waiting room activities.

---

# Events Published

---

## WaitingRoomEnteredEvent

Published when a participant knocks and is placed in the waiting room queue.

```yaml
Event: WaitingRoomEnteredEvent

Schema:
  eventId: string
  meetingId: string
  entryId: string
  participantId: string
  displayName: string
  requestedAt: ISO8601

Routing:
  topic: meeting.waiting_room.entered
  partitionKey: meetingId
```

---

## WaitingRoomParticipantAdmittedEvent

Published when a host or moderator admits a waiting participant into the meeting.

```yaml
Event: WaitingRoomParticipantAdmittedEvent

Schema:
  eventId: string
  meetingId: string
  entryId: string
  participantId: string
  admittedBy: string                 # ParticipantId of Host/Moderator
  admittedAt: ISO8601

Routing:
  topic: meeting.waiting_room.admitted
  partitionKey: meetingId

Side Effects:
  - Participant state transitions to ACTIVE.
  - LiveKit token delivered to participant client.
```

---

## WaitingRoomParticipantDeniedEvent

Published when a host or moderator denies a waiting participant entry.

```yaml
Event: WaitingRoomParticipantDeniedEvent

Schema:
  eventId: string
  meetingId: string
  entryId: string
  participantId: string
  deniedBy: string                   # ParticipantId of Host/Moderator
  reason: string | null
  deniedAt: ISO8601

Routing:
  topic: meeting.waiting_room.denied
  partitionKey: meetingId

Side Effects:
  - Participant state transitions to REMOVED/DENIED.
  - Restricted connection is terminated.
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | Automatically deny and clear any remaining queue entries. |

---

End of Document
