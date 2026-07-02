# feature-meeting/shared/EVENTS.md

Document ID: SHARED-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Meeting Shared Kernel & Cross-Cutting Concerns

Subdomain: feature-meeting/shared

---

# Overview

The `shared` subdomain defines the **base event envelope** and **event routing conventions** for all domain events within `feature-meeting`.

It does not publish any events directly. All events are published by their respective subdomains.

---

# 1. Base Event Envelope

All domain events within `feature-meeting` MUST conform to this base structure:

```kotlin
abstract class MeetingDomainEvent {
    abstract val eventId: String
    abstract val eventType: String
    abstract val meetingId: String
    abstract val occurredAt: Instant

    open val version: String = "1.0"
    open val source: String = "feature-meeting"
}
```

---

# 2. Event Catalog Summary

The following is the complete catalog of all domain events published across all `feature-meeting` subdomains:

## feature-meeting/lifecycle

| Event | Topic |
|-------|-------|
| `MeetingCreatedEvent` | `meeting.lifecycle.created` |
| `MeetingStartedEvent` | `meeting.lifecycle.started` |
| `MeetingEndedEvent` | `meeting.lifecycle.ended` |
| `MeetingPausedEvent` | `meeting.lifecycle.paused` |

## feature-meeting/participants

| Event | Topic |
|-------|-------|
| `ParticipantJoinedEvent` | `meeting.participants.joined` |
| `ParticipantLeftEvent` | `meeting.participants.left` |
| `ParticipantRemovedEvent` | `meeting.participants.removed` |
| `ParticipantRoleChangedEvent` | `meeting.participants.role_changed` |

## feature-meeting/room

| Event | Topic |
|-------|-------|
| `RoomCreatedEvent` | `meeting.room.created` |
| `RoomLockedEvent` | `meeting.room.locked` |
| `RoomUnlockedEvent` | `meeting.room.unlocked` |
| `RoomMutedAllEvent` | `meeting.room.muted_all` |
| `RoomDestroyedEvent` | `meeting.room.destroyed` |

## feature-meeting/permissions

| Event | Topic |
|-------|-------|
| `GlobalPermissionsChangedEvent` | `meeting.permissions.global_changed` |
| `ParticipantPermissionsOverriddenEvent` | `meeting.permissions.participant_overridden` |
| `ParticipantHandRaisedEvent` | `meeting.permissions.hand_raised` |
| `ParticipantHandLoweredEvent` | `meeting.permissions.hand_lowered` |
| `SpeakPermissionGrantedEvent` | `meeting.permissions.speak_granted` |
| `SpeakPermissionRevokedEvent` | `meeting.permissions.speak_revoked` |

## feature-meeting/invitations

| Event | Topic |
|-------|-------|
| `InvitationCreatedEvent` | `meeting.invitations.created` |
| `InvitationRsvpUpdatedEvent` | `meeting.invitations.rsvp_updated` |
| `InvitationRevokedEvent` | `meeting.invitations.revoked` |
| `MeetingPasscodeUpdatedEvent` | `meeting.passcode.updated` |

## feature-meeting/waiting-room

| Event | Topic |
|-------|-------|
| `WaitingRoomEnteredEvent` | `meeting.waiting_room.entered` |
| `WaitingRoomParticipantAdmittedEvent` | `meeting.waiting_room.admitted` |
| `WaitingRoomParticipantDeniedEvent` | `meeting.waiting_room.denied` |

## feature-meeting/scheduling

| Event | Topic |
|-------|-------|
| `MeetingScheduledEvent` | `meeting.scheduling.scheduled` |
| `MeetingRescheduledEvent` | `meeting.scheduling.rescheduled` |
| `MeetingCancelledEvent` | `meeting.scheduling.cancelled` |
| `MeetingReminderTriggeredEvent` | `meeting.scheduling.reminder_triggered` |

## feature-meeting/presence

| Event | Topic |
|-------|-------|
| `ParticipantPresenceChangedEvent` | `meeting.presence.state_changed` |
| `ActiveSpeakerChangedEvent` | `meeting.presence.active_speaker_changed` |
| `NetworkQualityDegradedEvent` | `meeting.presence.network_degraded` |

---

# 3. Event Routing Convention

All events MUST use the following routing rules:

| Property | Convention |
|----------|------------|
| Partition Key | `meetingId` (ensures ordering per meeting) |
| Retention | 7 days (configurable per topic) |
| Serialization | JSON (UTF-8) |
| Idempotency | All consumers must be idempotent (process duplicate events safely) |

---

End of Document
