# feature-meeting/participants/EVENTS.md

Document ID: PARTICIPANTS-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Participants Management

Subdomain: feature-meeting/participants

---

# Overview

This document defines all domain events published and consumed by the Participants subdomain.

Events are the primary integration mechanism with other subdomains and features.

---

# Events Published

---

## ParticipantJoinedEvent

Published when a participant successfully joins the meeting (status transitions to ACTIVE).

```yaml
Event: ParticipantJoinedEvent

Schema:
  eventId: string                  # Unique event ID
  meetingId: string
  participantId: string
  userId: string
  displayName: string
  role: enum [HOST, CO_HOST, MODERATOR, SPEAKER, ATTENDEE]
  joinedAt: ISO8601
  participantCount: integer         # Total active participants after this join

Routing:
  topic: meeting.participant.joined
  partitionKey: meetingId

Side Effects:
  - Translation Gateway: registers participant and applies language preference
  - LiveKit: participant's tracks become accessible to others
  - Notification: other participants notified via WebSocket
```

---

## ParticipantLeftEvent

Published when a participant leaves the meeting voluntarily.

```yaml
Event: ParticipantLeftEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  userId: string
  role: enum                         # Role at time of leaving
  leftAt: ISO8601
  wasHost: boolean                   # True if the leaving participant was the host
  participantCount: integer          # Remaining active participants

Routing:
  topic: meeting.participant.left
  partitionKey: meetingId

Side Effects:
  - If wasHost=true and no CO_HOST: triggers MeetingEndedEvent
  - Translation Router: removes participant from language session
  - LiveKit: participant's tracks removed from room
```

---

## ParticipantRemovedEvent

Published when a participant is removed by the host or moderator.

```yaml
Event: ParticipantRemovedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  userId: string
  removedBy: string                   # ParticipantId of the moderator/host who removed
  reason: string
  removedAt: ISO8601

Routing:
  topic: meeting.participant.removed
  partitionKey: meetingId

Side Effects:
  - Ban record created in participant_bans table
  - LiveKit: participant kicked from room, token revoked
  - Translation Router: participant removed from any active language session
  - Notification: removed participant receives REMOVED_FROM_MEETING event
```

---

## ParticipantRoleChangedEvent

Published when a participant's role is promoted or demoted.

```yaml
Event: ParticipantRoleChangedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  userId: string
  previousRole: enum
  newRole: enum
  changedBy: string                   # ParticipantId who made the change
  changedAt: ISO8601

Routing:
  topic: meeting.participant.role_changed
  partitionKey: meetingId

Side Effects:
  - LiveKit: participant's room permissions updated to reflect new role
  - All participants notified via WebSocket
```

---

## ParticipantMutedEvent

Published when a participant's audio is muted.

```yaml
Event: ParticipantMutedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string              # Who was muted
  mutedBy: string | null             # null = self-muted
  mutedAt: ISO8601

Routing:
  topic: meeting.participant.muted
  partitionKey: meetingId
```

---

## ParticipantUnmutedEvent

Published when a participant unmutes themselves.

```yaml
Event: ParticipantUnmutedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  unmutedAt: ISO8601

Routing:
  topic: meeting.participant.unmuted
  partitionKey: meetingId

Note:
  Only the participant themselves may unmute (not the host).
  If host wants audio from muted participant, host must request it,
  and the participant chooses to unmute.
```

---

## WaitingRoomParticipantAdmittedEvent

Published when a waiting participant is admitted by the host.

```yaml
Event: WaitingRoomParticipantAdmittedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  admittedBy: string                 # Host/Moderator ParticipantId
  admittedAt: ISO8601

Routing:
  topic: meeting.waiting_room.admitted
  partitionKey: meetingId
```

---

## WaitingRoomParticipantDeniedEvent

Published when a waiting participant is denied entry.

```yaml
Event: WaitingRoomParticipantDeniedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  deniedBy: string
  deniedAt: ISO8601

Routing:
  topic: meeting.waiting_room.denied
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingStartedEvent` | feature-meeting/lifecycle | Enable participant join flow |
| `MeetingEndedEvent` | feature-meeting/lifecycle | Mark all ACTIVE participants as LEFT, cleanup |
| `MeetingEndedEvent` | feature-meeting/lifecycle | Revoke all LiveKit tokens for the meeting |

---

# Event Choreography: Host Leaves

```
Host calls POST /participants/{participantId}/leave
  ↓
LeaveMeetingUseCase executes
  ↓
Check: Are there any CO_HOST participants?
  │
  ├── [YES] → Promote first CO_HOST to HOST
  │           → PUBLISH ParticipantRoleChangedEvent
  │           → PUBLISH ParticipantLeftEvent {wasHost: true}
  │
  └── [NO]  → PUBLISH ParticipantLeftEvent {wasHost: true}
              → MeetingEndedEvent triggered (meeting auto-ends)
```

---

# Event Choreography: New Participant Joins

```
User calls POST /participants/join
  ↓
JoinMeetingUseCase validates:
  - Meeting is ACTIVE
  - User not banned
  - Not at participant limit
  ↓
Waiting room enabled?
  ├── [NO]  → Status = ACTIVE
  │           PUBLISH ParticipantJoinedEvent
  │           Return LiveKit token
  │
  └── [YES] → Status = WAITING
              PUBLISH WaitingRoomEnteredEvent
              Return 202 (waiting for approval)
              ↓
              Host admits via POST /waiting-room/{id}/admit
              ↓
              Status = ACTIVE
              PUBLISH WaitingRoomParticipantAdmittedEvent
              PUBLISH ParticipantJoinedEvent
              Return LiveKit token to participant
```

---

End of Document
