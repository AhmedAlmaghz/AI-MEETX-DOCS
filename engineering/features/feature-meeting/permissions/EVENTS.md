# feature-meeting/permissions/EVENTS.md

Document ID: PERMISSIONS-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Permissions & Role-Based Access Control

Subdomain: feature-meeting/permissions

---

# Overview

Defines domain events related to permissions changes, locking controls, and hand-raise flows.

---

# Events Published

---

## GlobalPermissionsChangedEvent

Published when the host or co-host updates the global attendee lockouts or policies.

```yaml
Event: GlobalPermissionsChangedEvent

Schema:
  eventId: string
  meetingId: string
  lockAttendeeAudio: boolean
  lockAttendeeVideo: boolean
  lockAttendeeChat: boolean
  allowAttendeeScreenShare: boolean
  waitingRoomPolicy: enum [EVERYONE, AUTHENTICATED_USERS, INVITED_GUESTS, NONE]
  changedBy: string                      # ParticipantId
  changedAt: ISO8601

Routing:
  topic: meeting.permissions.global_changed
  partitionKey: meetingId

Side Effects:
  - LiveKit: if lockAttendeeAudio or lockAttendeeVideo is enabled, existing attendee tracks are muted/disabled server-side.
```

---

## ParticipantPermissionsOverriddenEvent

Published when a participant's individual permissions are customized.

```yaml
Event: ParticipantPermissionsOverriddenEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  allowedPermissions: list of enum [PUBLISH_AUDIO, PUBLISH_VIDEO, SHARE_SCREEN, SEND_CHAT]
  deniedPermissions: list of enum [PUBLISH_AUDIO, PUBLISH_VIDEO, SHARE_SCREEN, SEND_CHAT]
  overriddenBy: string
  overriddenAt: ISO8601

Routing:
  topic: meeting.permissions.participant_overridden
  partitionKey: meetingId
```

---

## ParticipantHandRaisedEvent

Published when a participant raises their hand to request speaking rights.

```yaml
Event: ParticipantHandRaisedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  displayName: string
  raisedAt: ISO8601

Routing:
  topic: meeting.permissions.hand_raised
  partitionKey: meetingId
```

---

## ParticipantHandLoweredEvent

Published when a hand is lowered, either by the participant or a moderator.

```yaml
Event: ParticipantHandLoweredEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  loweredBy: string                      # ParticipantId of self or moderator
  loweredAt: ISO8601

Routing:
  topic: meeting.permissions.hand_lowered
  partitionKey: meetingId
```

---

## SpeakPermissionGrantedEvent

Published when an attendee is granted permission to speak.

```yaml
Event: SpeakPermissionGrantedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  grantedBy: string
  grantedAt: ISO8601

Routing:
  topic: meeting.permissions.speak_granted
  partitionKey: meetingId

Side Effects:
  - LiveKit: Participant track publishing permissions updated to allow audio.
```

---

## SpeakPermissionRevokedEvent

Published when speak permission is revoked from an attendee.

```yaml
Event: SpeakPermissionRevokedEvent

Schema:
  eventId: string
  meetingId: string
  participantId: string
  revokedBy: string
  revokedAt: ISO8601

Routing:
  topic: meeting.permissions.speak_revoked
  partitionKey: meetingId

Side Effects:
  - LiveKit: Participant audio track muted and publishing revoked.
```

---

# Events Consumed

| Event | Source | Handler |
|-------|--------|---------|
| `MeetingEndedEvent` | feature-meeting/lifecycle | Trigger cleanup of overrides and permissions records. |
| `ParticipantLeftEvent` | feature-meeting/participants | Delete specific participant overrides. |

---

End of Document
