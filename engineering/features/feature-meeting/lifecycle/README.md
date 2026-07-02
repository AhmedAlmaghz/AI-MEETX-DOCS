# feature-meeting/lifecycle/README.md
Document ID: MEETING-LIFECYCLE-README-001

Version: 1.0.0

Status: Approved

Feature: Meeting

Subdomain: Lifecycle

Priority: P0

Owner: Platform Architecture Team

---

# Meeting Lifecycle Subdomain

## Overview

The Meeting Lifecycle subdomain is the **core of the entire platform**.

It is responsible for controlling the existence and state of every meeting from creation to deletion.

All other meeting subdomains (Participants, Media, Chat, Translation, Recording, AI) depend on lifecycle events to operate correctly.

---

## Subdomain Responsibilities

- Creating meetings (instant and scheduled)
- Transitioning meetings through defined states
- Publishing lifecycle events to all dependent services
- Enforcing access policies (host ownership)
- Archiving and soft-deleting meetings

---

## Documents in this Subdomain

| Document        | Purpose                                          |
|-----------------|--------------------------------------------------|
| REQUIREMENTS.md | Functional and non-functional requirements       |
| SPECIFICATION.md| Domain model, state machine, use cases, invariants|
| DATABASE.md     | PostgreSQL schema and Firebase realtime schema   |
| API.md          | REST API contracts                               |
| EVENTS.md       | Domain events catalog and consumers              |
| TESTS.md        | Test cases and acceptance criteria               |

---

## Module Location

```
feature-meeting/
└── lifecycle/
    ├── domain/
    │   ├── model/         ← Meeting aggregate, value objects
    │   ├── usecase/       ← Business use cases
    │   ├── event/         ← Domain events
    │   └── policy/        ← Access policies
    ├── data/
    │   ├── repository/    ← MeetingRepository implementation
    │   └── local/         ← Local caching
    ├── presentation/      ← UI layer (ViewModels, Screens)
    └── di/                ← Hilt modules
```

---

## State Machine Summary

```
DRAFT → SCHEDULED → WAITING → ACTIVE ↔ PAUSED → ENDED → ARCHIVED → DELETED
```

---

## Key Domain Events

| Event                   | When                      |
|-------------------------|---------------------------|
| MeetingCreatedEvent     | Meeting is created        |
| MeetingStartedEvent     | Host starts the meeting   |
| MeetingEndedEvent       | Host ends the meeting     |
| MeetingPausedEvent      | Host pauses the meeting   |
| MeetingResumedEvent     | Host resumes the meeting  |
| MeetingCancelledEvent   | Scheduled meeting cancelled|
| MeetingArchivedEvent    | Auto-archived after end   |
| MeetingDeletedEvent     | Meeting soft-deleted      |

---

## Dependencies

This subdomain depends on:

- `core-model` — Shared domain primitives
- `core-event` — EventBus abstraction
- `feature-auth` — Authentication and UserId

---

## Consuming Subdomains

The following subdomains listen to lifecycle events:

- Participants Subdomain
- Media Engine
- Chat Subdomain
- Translation Subdomain
- Recording Subdomain
- AI Assistant Subdomain
- Notifications Subdomain
- Analytics Subdomain

---

## Development Phase

**Phase:** 3 — Meeting Core

**Priority:** P0 — Critical Path

No other meeting subdomain can be started until lifecycle is complete.

---

End of Document
