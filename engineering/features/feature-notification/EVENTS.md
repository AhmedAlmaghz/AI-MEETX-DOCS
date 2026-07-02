# feature-notification/EVENTS.md

Document ID: NOTIF-EVENTS-001

Version: 1.0.0

Status: Approved

Feature: Notification System

Module: feature-notification

---

# Overview

`feature-notification` is a **pure consumer** of domain events. It publishes no domain events of its own — its outputs are side effects (push, email, SMS delivery) triggered by the events it consumes.

---

# Events Consumed

| Event | Source | Notification Type | Channels |
|-------|--------|-------------------|---------|
| `InvitationCreatedEvent` | feature-meeting/invitations | Meeting Invitation | EMAIL (with ICS) |
| `InvitationRsvpUpdatedEvent` | feature-meeting/invitations | RSVP Update | EMAIL |
| `MeetingScheduledEvent` | feature-meeting/scheduling | Meeting Confirmation | EMAIL |
| `MeetingRescheduledEvent` | feature-meeting/scheduling | Reschedule Alert | EMAIL + PUSH |
| `MeetingCancelledEvent` | feature-meeting/scheduling | Cancellation Notice | EMAIL + PUSH |
| `MeetingReminderTriggeredEvent` | feature-meeting/scheduling | Meeting Reminder | PUSH + EMAIL + SMS |
| `MeetingStartedEvent` | feature-meeting/lifecycle | Meeting Started | PUSH |
| `WaitingRoomParticipantAdmittedEvent` | feature-meeting/waiting-room | Lobby Admitted | PUSH |
| `WaitingRoomParticipantDeniedEvent` | feature-meeting/waiting-room | Entry Denied | PUSH |
| `RecordingReadyEvent` | feature-recording | Recording Ready | PUSH + EMAIL |
| `AiReportGeneratedEvent` | feature-ai | AI Report Ready | EMAIL |
| `SpeakPermissionGrantedEvent` | feature-meeting/permissions | Speaking Rights Granted | PUSH |

---

# Handler Conventions

Each consumed event maps to a dedicated `EventHandler`:

```kotlin
@EventHandler
class InvitationCreatedHandler(
    private val notificationService: NotificationService,
    private val userRepository: UserRepository
) {
    @Consume("meeting.invitations.created")
    suspend fun handle(event: InvitationCreatedEvent) {
        // Fetch user by email
        // Check preferences for EMAIL channel
        // Render template with ICS attachment
        // Call notificationService.send(...)
    }
}
```

---

End of Document
