# engineering/features/feature-media/media-session/TESTS.md

Document ID: MEDIA-SESSION-TEST-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Session

---

# Purpose

Defines the verification strategy for the Media Session subdomain.

General testing strategy is defined in:

- TESTING_STRATEGY.md
- MEDIA_TESTING_GUIDE.md

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

MediaSession Aggregate

Verify:

✓ Session creation

✓ State transitions

✓ Invariants

✓ Single session per participant

✓ Recovery rules

---

# State Machine Tests

Verify valid transitions:

Created

→ Initializing

→ Ready

→ Active

→ Paused

→ Recovering

→ Closed

Reject invalid transitions:

- Closed → Active
- Ready → Created
- Recovering → Closed (without resolution)

---

# Lifecycle Tests

Create Session

- Valid participant
- Invalid participant
- Duplicate session

Initialize Session

- Successful initialization
- Missing capabilities
- Failed initialization rollback

Activate Session

- Ready state only
- Network unavailable
- Already active session

Pause Session

- Active only
- Duplicate pause

Resume Session

- Paused only

Recover Session

- Network failure
- Partial recovery
- Full recovery
- Recovery timeout

Close Session

- Active session
- Paused session
- Already closed

---

# Repository Tests

Verify:

✓ Create session persistence

✓ Update state persistence

✓ Recovery state persistence

✓ Close session persistence

✓ Query by participant

✓ Query by meeting

✓ Active session lookup

---

# API Contract Tests

Verify:

POST /sessions

POST /{id}/initialize

POST /{id}/activate

POST /{id}/pause

POST /{id}/resume

POST /{id}/recover

DELETE /{id}

Validate:

DTO structure

HTTP status codes

Error envelope

Authorization rules

---

# Event Tests

Verify emission of:

MediaSessionCreatedEvent

MediaSessionInitializedEvent

MediaSessionActivatedEvent

MediaSessionPausedEvent

MediaSessionResumedEvent

MediaSessionRecoveringEvent

MediaSessionRecoveredEvent

MediaSessionClosedEvent

Validate:

Payload correctness

Ordering

Idempotency

CorrelationId propagation

---

# Concurrency Tests

Two sessions created for same participant

Simultaneous activate calls

Simultaneous recovery attempts

Network flapping scenarios

Duplicate close requests

---

# Recovery Tests

Network loss during Active state

System restart during Recovery

Partial initialization failure

Delayed event delivery

Idempotent recovery replays

---

# Security Tests

Verify:

Session access restricted to participant

No cross-participant session access

No exposure of transport data

Invalid session manipulation rejected

---

# Performance Tests

Session creation

< 2 seconds

Activation

< 3 seconds

Recovery

< 5 seconds

State transition

< 300 ms

---

# Observability Tests

Verify:

Logs generated per transition

Metrics incremented correctly

Trace correlation maintained

Error events captured

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

Events

95%

---

# Completion Criteria

✓ State machine verified

✓ API contracts verified

✓ Repository verified

✓ Event flow verified

✓ Security validated

✓ Performance targets achieved

---

End of Document