# feature-meeting/room/EVENTS.md

Document ID: ROOM-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Room Management

Subdomain: feature-meeting/room

---

# Overview

This document defines all domain events published and consumed by the Room subdomain.

---

# Events Published

---

## RoomCreatedEvent

Published when a LiveKit room is successfully created for a meeting.

```yaml
Event: RoomCreatedEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  livekitRoomName: string
  settings:
    maxParticipants: integer
    maxVideoBitrateKbps: integer
    audioQuality: enum [ECONOMY, STANDARD, HIGH]
  createdAt: ISO8601

Routing:
  topic: meeting.room.created
  partitionKey: meetingId
```

---

## RoomDestroyedEvent

Published when the LiveKit room is destroyed after meeting end.

```yaml
Event: RoomDestroyedEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  livekitRoomName: string
  destroyedAt: ISO8601
  reason: enum [MEETING_ENDED, HOST_ACTION, SYSTEM_CLEANUP]

Routing:
  topic: meeting.room.destroyed
  partitionKey: meetingId
```

---

## RoomLockedEvent

Published when the host locks the room.

```yaml
Event: RoomLockedEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  lockedBy: string              # ParticipantId
  lockedAt: ISO8601

Routing:
  topic: meeting.room.locked
  partitionKey: meetingId
```

---

## RoomUnlockedEvent

Published when the host unlocks the room.

```yaml
Event: RoomUnlockedEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  unlockedBy: string
  unlockedAt: ISO8601

Routing:
  topic: meeting.room.unlocked
  partitionKey: meetingId
```

---

## RoomMutedAllEvent

Published when the host mutes all participants.

```yaml
Event: RoomMutedAllEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  mutedBy: string              # ParticipantId
  mutedCount: integer
  mutedAt: ISO8601

Routing:
  topic: meeting.room.muted_all
  partitionKey: meetingId
```

---

## RoomVideoDisabledEvent

Published when the host disables all video.

```yaml
Event: RoomVideoDisabledEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  disabledBy: string
  disabledAt: ISO8601

Routing:
  topic: meeting.room.video_disabled
  partitionKey: meetingId
```

---

## RoomSettingsChangedEvent

Published when any room setting is updated.

```yaml
Event: RoomSettingsChangedEvent

Schema:
  eventId: string
  meetingId: string
  roomId: string
  changedBy: string
  previousSettings: RoomSettings
  newSettings: RoomSettings
  changedAt: ISO8601

Routing:
  topic: meeting.room.settings_changed
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingStartedEvent` | feature-meeting/lifecycle | Trigger `CreateRoomUseCase` |
| `MeetingEndedEvent` | feature-meeting/lifecycle | Trigger `DestroyRoomUseCase` |
| `ParticipantRemovedEvent` | feature-meeting/participants | Kick participant from LiveKit room |

---

# Event Choreography: Meeting Starts → Room Created

```
MeetingStartedEvent received
  ↓
CreateRoomUseCase.execute(meetingId, planConfig)
  ↓
LivekitGateway.createRoom(roomName, config)
  ↓
Save MeetingRoom { status: ACTIVE }
  ↓
PUBLISH RoomCreatedEvent
  ↓
Participants can now receive LiveKit tokens and join
```

---

# Event Choreography: Meeting Ends → Room Destroyed

```
MeetingEndedEvent received
  ↓
DestroyRoomUseCase.execute(meetingId)
  ↓
LivekitGateway.deleteRoom(roomName)
  ↓
Update MeetingRoom { status: ENDED, destroyedAt: NOW() }
  ↓
PUBLISH RoomDestroyedEvent
  ↓
Translation sessions are terminated (handled by feature-translation)
```

---

End of Document
