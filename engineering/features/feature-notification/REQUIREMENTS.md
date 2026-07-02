# feature-notification/REQUIREMENTS.md

Document ID: NOTIF-REQ-001

Version: 1.0.0

Status: Approved

Feature: Notification System

Module: feature-notification

Priority: P0

Owner: Platform Team

Phase: 5

---

# 1. Overview

The `feature-notification` module is the platform-wide notification delivery system.

It receives domain events from all other modules and dispatches notifications to participants through multiple channels: Push (FCM/APNs), Email (SendGrid/SES), and SMS.

---

# 2. Business Requirements

| ID | Requirement |
|----|-------------|
| NOTIF-BR-001 | The system MUST support push notifications (Android FCM and iOS APNs). |
| NOTIF-BR-002 | The system MUST support email notifications via a transactional email provider. |
| NOTIF-BR-003 | The system MUST support SMS for critical alerts (meeting start reminders). |
| NOTIF-BR-004 | Users MUST be able to configure their notification preferences (per channel, per event type). |
| NOTIF-BR-005 | The system MUST NOT send notifications if the user has disabled the specific channel. |

---

# 3. Functional Requirements

## 3.1 Notification Types

| Type | Channel | Trigger Event |
|------|---------|---------------|
| Meeting Invitation | Email | `InvitationCreatedEvent` |
| RSVP Update | Email | `InvitationRsvpUpdatedEvent` |
| Meeting Reminder (15 min) | Push + Email + SMS | `MeetingReminderTriggeredEvent` |
| Meeting Started | Push | `MeetingStartedEvent` |
| Recording Ready | Push + Email | `RecordingReadyEvent` |
| AI Report Ready | Email | `AiReportGeneratedEvent` |
| Meeting Cancelled | Email + Push | `MeetingCancelledEvent` |
| Participant Admitted | Push | `WaitingRoomParticipantAdmittedEvent` |

## 3.2 User Preferences

| ID | Requirement |
|----|-------------|
| NOTIF-FR-010 | Users MUST be able to configure preferences per notification type and per channel. |
| NOTIF-FR-011 | Preferences MUST be respected immediately — no delay in applying user settings. |

## 3.3 Delivery Guarantees

| ID | Requirement |
|----|-------------|
| NOTIF-FR-020 | Notifications MUST be delivered at least once. |
| NOTIF-FR-021 | Duplicate deliveries within 60 seconds MUST be suppressed (idempotency key). |

---

# 4. Non-Functional Requirements

| ID | Metric | Target |
|----|--------|--------|
| NOTIF-NFR-001 | Push notification delivery latency | < 3 seconds p95 |
| NOTIF-NFR-002 | Email delivery initiation | < 5 seconds p95 |
| NOTIF-NFR-003 | System throughput | 5,000 notifications/second |

---

# 5. Dependencies

- Consumes events from: feature-meeting (all subdomains), feature-ai, feature-recording.
- External: FCM, APNs, SendGrid (or AWS SES), Twilio (SMS).

---

End of Document
