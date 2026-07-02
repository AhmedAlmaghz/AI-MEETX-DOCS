# feature-meeting/presence/EVENTS.md

Document ID: PRESENCE-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Presence Tracking & Active Speakers

Subdomain: feature-meeting/presence

---

# Overview

Defines domain events published and consumed for participant connectivity changes and speaking detection.

---

# Events Published

---

## ParticipantPresenceChangedEvent

Published when a participant's connection state transitions (CONNECTED ↔ RECONNECTING ↔ DISCONNECTED).

```yaml
Event: ParticipantPresenceChangedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  previousState: enum [CONNECTED, RECONNECTING, DISCONNECTED]
  newState: enum [CONNECTED, RECONNECTING, DISCONNECTED]
  networkQuality: enum [EXCELLENT, GOOD, FAIR, POOR]
  changedAt: ISO8601

Routing:
  topic: meeting.presence.state_changed
  partitionKey: meetingId
```

---

## ActiveSpeakerChangedEvent

Published when the dominant active speaker changes in the room.

```yaml
Event: ActiveSpeakerChangedEvent

Schema:
  eventId: string
  meetingId: string
  previousSpeakerId: string | null
  newSpeakerId: string
  audioLevel: float
  detectedAt: ISO8601

Routing:
  topic: meeting.presence.active_speaker_changed
  partitionKey: meetingId
```

---

## NetworkQualityDegradedEvent

Published when a participant's network quality drops below FAIR (threshold: POOR).

```yaml
Event: NetworkQualityDegradedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  previousQuality: enum
  currentQuality: POOR
  latencyMs: integer
  packetLossPercent: float
  detectedAt: ISO8601

Routing:
  topic: meeting.presence.network_degraded
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | Delete all Redis presence keys, flush presence analytics to Postgres. |
| `ParticipantLeftEvent` | feature-meeting/participants | Remove participant presence record from Redis. |

---

End of Document
