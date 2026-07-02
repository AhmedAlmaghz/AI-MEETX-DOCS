# engineering/features/feature-meeting/lifecycle/SPECIFICATION.md

Document ID: MEETING-LIFECYCLE-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

---

# Purpose

Defines the internal domain model and behavior of the Meeting Lifecycle subdomain.

This subdomain is the single source of truth for meeting state.

No other feature or subdomain may modify meeting lifecycle directly.

---

# Aggregate Root

Meeting

The Meeting aggregate controls:

- Identity
- State
- Lifecycle
- Scheduling
- Ownership

All lifecycle changes SHALL pass through this aggregate.

---

# Value Objects

MeetingId

MeetingTitle

MeetingType

MeetingStatus

MeetingSchedule

MeetingSettings

RetentionPolicy

MeetingMetadata

---

# Entities

Meeting

Fields

- meetingId
- ownerId
- title
- description
- type
- status
- schedule
- settings
- metadata
- createdAt
- updatedAt
- archivedAt

---

# Aggregate Invariants

The following rules SHALL NEVER be violated.

INV-001

MeetingId is immutable.

---

INV-002

Owner cannot change after creation.

---

INV-003

Only one active lifecycle exists.

---

INV-004

Archived meetings cannot become Active.

---

INV-005

Deleted meetings are immutable.

---

INV-006

Meeting status transitions must follow the approved state machine.

---

# Lifecycle State Machine

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

Invalid transitions SHALL be rejected.

---

# Domain Services

MeetingLifecycleService

Responsibilities

- validate transitions
- execute transitions
- publish lifecycle events

---

MeetingSchedulingService

Responsibilities

- validate schedule
- calculate next occurrence
- recurring meetings

---

MeetingRetentionService

Responsibilities

- archive eligibility
- deletion eligibility
- restore validation

---

# Public Use Cases

CreateMeetingUseCase

StartMeetingUseCase

PauseMeetingUseCase

ResumeMeetingUseCase

EndMeetingUseCase

CancelMeetingUseCase

ArchiveMeetingUseCase

RestoreMeetingUseCase

DeleteMeetingUseCase

GetMeetingUseCase

UpdateMeetingMetadataUseCase

---

# Internal Policies

Creation Policy

Meeting starts in Draft or Scheduled.

---

Activation Policy

Meeting cannot become Active before validation succeeds.

---

Completion Policy

Meeting must finalize:

- recording
- analytics
- event publication

before entering Ended state.

---

Retention Policy

Archived meetings remain available until retention expires.

---

# Validation Rules

Title

Length

3–150 characters

---

Description

Maximum

2000 characters

---

Scheduled Meeting

Start time must be before end time.

---

Recurring Meeting

Must contain recurrence rule.

---

Password

Optional.

If present, minimum length:

8 characters.

---

# Integration Contracts

Consumes

UserAuthenticatedEvent

NetworkAvailableEvent

ApplicationStartedEvent

---

Produces

MeetingCreatedEvent

MeetingStartedEvent

MeetingPausedEvent

MeetingResumedEvent

MeetingEndedEvent

MeetingCancelledEvent

MeetingArchivedEvent

MeetingDeletedEvent

---

# Dependencies

Meeting aggregate SHALL NOT depend on:

- Chat
- Media
- Translation
- AI

These features consume lifecycle events instead.

---

# Error Model

MeetingAlreadyActive

MeetingAlreadyEnded

MeetingAlreadyArchived

MeetingDeleted

InvalidStateTransition

MeetingNotFound

UnauthorizedHost

ScheduleConflict

---

# Synchronization

Source of Truth

Meeting Repository

Propagation

Repository

↓

Event Bus

↓

Interested Features

---

# Completion Criteria

- Aggregate implemented
- State machine validated
- Domain services implemented
- Invariants enforced
- Events integrated
- Tests passing

---

End of Document