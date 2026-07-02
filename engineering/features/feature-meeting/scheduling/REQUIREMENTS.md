# feature-meeting/scheduling/REQUIREMENTS.md

Document ID: SCHEDULING-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Scheduling & Calendar

Subdomain: feature-meeting/scheduling

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The Scheduling subdomain manages the creation of scheduled meetings, recurring series, timezone conversions, and calendar integration exports.

It handles booking meetings in advance, managing schedule changes, and issuing reminders prior to meeting start times.

---

# 2. Business Requirements

## 2.1 Scheduling Capabilities

| ID | Requirement |
|----|-------------|
| SC-BR-001 | Users MUST be able to schedule single-instance meetings with title, description, date, time, duration, and timezone. |
| SC-BR-002 | The system MUST support timezone conversions so that participants see dates in their local time. |
| SC-BR-003 | Scheduled meetings MUST transition to `WAITING` or `ACTIVE` states only when the scheduled window arrives or when the host explicitly starts it. |
| SC-BR-004 | Users MUST be able to edit, reschedule, or cancel scheduled meetings. |
| SC-BR-005 | The system MUST support recurring meetings (daily, weekly, monthly, custom series). |

## 2.2 Calendar & Sync

| ID | Requirement |
|----|-------------|
| SC-BR-010 | The system MUST generate standard `.ics` (iCalendar) calendar files for scheduled meetings. |
| SC-BR-011 | The system MUST provide "Add to Calendar" links for Google Calendar, Outlook, and Apple Calendar. |

---

# 3. Functional Requirements

## 3.1 Scheduling Flow

| ID | Requirement |
|----|-------------|
| SC-FR-001 | On scheduling, the system MUST validate that the scheduled start time is in the future. |
| SC-FR-002 | On scheduling, the system MUST generate a unique meeting ID and passcode and publish `MeetingScheduledEvent`. |
| SC-FR-003 | If the host cancels, the system MUST notify all invitees and publish `MeetingCancelledEvent`. |

## 3.2 Recurring Series (RRule)

| ID | Requirement |
|----|-------------|
| SC-FR-010 | The system MUST support standard RFC 5545 recurrence rules (RRule) for recurring series. |
| SC-FR-011 | Editing a recurring meeting MUST offer options: "Edit this occurrence" or "Edit all occurrences". |
| SC-FR-012 | The system MUST be able to expand recurring schedules to list future occurrences up to 1 year in advance. |

## 3.3 Reminders & Notifications

| ID | Requirement |
|----|-------------|
| SC-FR-020 | The system MUST trigger reminder notifications at configured intervals (e.g. 15 minutes before, 5 minutes before). |
| SC-FR-021 | The system MUST check reminder schedules periodically and publish `MeetingReminderTriggeredEvent`. |

---

# 4. Non-Functional Requirements

## 4.1 Performance

| ID | Metric | Target |
|----|--------|--------|
| SC-NFR-001 | Recurrence expansion speed (1 year) | < 100ms |
| SC-NFR-002 | ICS generation latency | < 200ms p95 |

## 4.2 Timezone Handling

| ID | Requirement |
|----|-------------|
| SC-NFR-010 | All scheduled times MUST be stored in UTC format in the database alongside the user's primary timezone ID (IANA format, e.g., "Asia/Riyadh"). |
| SC-NFR-011 | Recurring schedules MUST correctly adapt to Daylight Saving Time (DST) transitions. |

---

# 5. Dependencies

- `feature-meeting/lifecycle` -> To link schedules to meeting states.
- `feature-meeting/invitations` -> To attach invitations to schedules.
- `feature-notification` -> To send scheduled reminders.

---

End of Document
