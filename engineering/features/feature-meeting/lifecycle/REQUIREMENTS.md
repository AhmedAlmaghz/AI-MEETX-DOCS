# engineering/features/feature-meeting/lifecycle/REQUIREMENTS.md

Document ID: MEETING-LIFECYCLE-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

Priority: P0

---

# Purpose

Defines the functional requirements for the complete lifecycle of a meeting.

This subdomain is responsible for controlling the existence and state transitions of meetings.

---

# Responsibilities

The Meeting Lifecycle SHALL manage:

- Meeting creation
- Meeting initialization
- Meeting activation
- Meeting termination
- Meeting cancellation
- Meeting archival
- Meeting state transitions

---

# Out of Scope

Handled by other subdomains:

- Participants
- Permissions
- Waiting Room
- Chat
- Media
- Translation
- Recording
- AI
- Notifications

---

# Functional Requirements

## ML-FR-001

Create Meeting

The system SHALL allow an authenticated user to create a meeting.

Required fields:

- title
- meetingType
- ownerId

Optional:

- description
- scheduledStart
- scheduledEnd
- password
- tags

Output:

MeetingId

---

## ML-FR-002

Start Meeting

Only an authorized host MAY start a meeting.

Starting a meeting SHALL:

- change state
- publish MeetingStartedEvent
- initialize room context

---

## ML-FR-003

End Meeting

The host SHALL end the meeting.

Ending SHALL:

- disconnect active sessions
- stop media pipelines
- trigger recording finalization
- publish MeetingEndedEvent

---

## ML-FR-004

Cancel Meeting

Scheduled meetings MAY be cancelled before starting.

Cancellation SHALL notify dependent services.

---

## ML-FR-005

Archive Meeting

Completed meetings SHALL become read-only.

Archived meetings SHALL remain searchable.

---

## ML-FR-006

Delete Meeting

Deletion policy:

Soft Delete

Physical deletion is handled by retention policies.

---

## ML-FR-007

Restore Meeting

Previously archived meetings MAY be restored if retention policy permits.

---

# Meeting Types

Supported:

- Instant
- Scheduled
- Recurring
- Classroom
- Webinar

---

# Meeting States

Draft

↓

Scheduled

↓

Waiting

↓

Active

↓

Paused

↓

Ended

↓

Archived

↓

Deleted

---

# Allowed State Transitions

Draft

→ Scheduled

→ Deleted

Scheduled

→ Waiting

→ Cancelled

Waiting

→ Active

→ Cancelled

Active

→ Paused

→ Ended

Paused

→ Active

→ Ended

Ended

→ Archived

Archived

→ Deleted

---

# Business Rules

Host owns meeting lifecycle.

Only one active lifecycle exists per meeting.

Meeting state SHALL be immutable once persisted.

Every state transition SHALL generate an event.

---

# Non Functional Requirements

Meeting creation

< 2 seconds

Meeting start

< 3 seconds

Meeting termination

Graceful shutdown

State synchronization

Eventually consistent (< 2 sec)

---

# Dependencies

feature-auth

event-system

core-model

core-network

---

# Acceptance Criteria

✓ Create meeting

✓ Start meeting

✓ Pause meeting

✓ Resume meeting

✓ End meeting

✓ Archive meeting

✓ Restore meeting

✓ Delete meeting

✓ Events published

✓ Tests passing

---

End of Document