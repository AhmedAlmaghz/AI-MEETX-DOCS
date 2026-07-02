# engineering/features/feature-meeting/lifecycle/TESTS.md

Document ID: MEETING-LIFECYCLE-TEST-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

---

# Purpose

Defines the verification strategy for the Meeting Lifecycle subdomain.

General testing rules are defined in:

- TESTING_STRATEGY.md
- CODING_STANDARDS.md

Only lifecycle-specific tests are defined here.

---

# Test Pyramid

Unit Tests

↓

Integration Tests

↓

Contract Tests

↓

End-to-End Tests

---

# Aggregate Tests

Meeting Aggregate

Verify

✓ Aggregate creation

✓ Aggregate invariants

✓ State transitions

✓ Version increment

✓ Event generation

---

# State Machine Tests

Verify every valid transition.

Draft

→ Scheduled

Scheduled

→ Waiting

Waiting

→ Active

Active

→ Paused

Paused

→ Active

Active

→ Ended

Ended

→ Archived

Archived

→ Deleted

---

Reject

All invalid transitions.

---

# Invariant Tests

INV-001

MeetingId immutable

---

INV-002

Owner immutable

---

INV-003

Deleted meetings cannot change

---

INV-004

Archived meetings cannot become Active

---

INV-005

Exactly one active lifecycle

---

# Use Case Tests

CreateMeetingUseCase

Verify

- Success
- Validation failure
- Duplicate request (Idempotency)

---

StartMeetingUseCase

Verify

- Authorized host
- Invalid state
- Event published

---

PauseMeetingUseCase

Verify

- Active only
- Duplicate pause rejected

---

ResumeMeetingUseCase

Verify

- Paused only

---

EndMeetingUseCase

Verify

- Active meeting
- Cleanup triggered
- Event published

---

ArchiveMeetingUseCase

Verify

- Ended only

---

RestoreMeetingUseCase

Verify

- Archived only

---

DeleteMeetingUseCase

Verify

- Soft delete
- Repository update

---

# Repository Tests

Verify

✓ Save

✓ Update

✓ Restore

✓ Archive

✓ Delete

✓ Query by Id

✓ Query Active

✓ Query Scheduled

✓ Query Archived

---

# API Contract Tests

Verify

POST /meetings

GET /meetings/{id}

PATCH /meetings/{id}

POST /start

POST /pause

POST /resume

POST /end

POST /archive

DELETE

Validation

HTTP Status

DTO Contract

Error Envelope

---

# Event Tests

Verify

MeetingCreatedEvent

MeetingStartedEvent

MeetingPausedEvent

MeetingResumedEvent

MeetingEndedEvent

MeetingArchivedEvent

MeetingDeletedEvent

MeetingCancelledEvent

Verify

Payload

Metadata

Version

CorrelationId

Ordering

---

# Concurrency Tests

Multiple Start Requests

Expected

One succeeds

Others rejected

---

Multiple End Requests

Expected

Single transition

---

Optimistic Locking

Verify

409 Conflict

---

# Performance Tests

Meeting Creation

< 2 seconds

Meeting Start

< 3 seconds

State Transition

< 300 ms

Repository Read

< 100 ms

---

# Recovery Tests

Server restart

↓

Restore meeting state

↓

Resume event processing

---

Network interruption

↓

Retry synchronization

↓

No duplicate lifecycle events

---

# Security Tests

Verify

Unauthorized lifecycle mutation rejected

Invalid owner rejected

Deleted meeting inaccessible

Archived meeting immutable

---

# Observability Tests

Verify

Logs created

Metrics incremented

Trace propagated

CorrelationId preserved

Audit generated

---

# Coverage Targets

Aggregate

100%

Use Cases

95%

Repository

90%

API

90%

State Machine

100%

---

# Completion Criteria

✓ Aggregate verified

✓ State machine verified

✓ API contracts verified

✓ Repository verified

✓ Events verified

✓ Concurrency verified

✓ Security verified

✓ Performance targets achieved

---

End of Document