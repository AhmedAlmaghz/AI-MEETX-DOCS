# engineering/features/feature-media/media-platform/SPECIFICATION.md

Document ID: MEDIA-PLATFORM-SPEC-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Platform Shell

---

# Purpose

Defines the domain model and orchestration rules for user-facing media experiences.

The Media Platform abstracts calls, meetings, and webinars into a unified session model built on top of Media Orchestrator and Media Engines.

---

# Core Concept

The Media Platform is a **Session Experience Layer**.

It does NOT handle media or networking.

It manages:

- User-facing session semantics
- Participant roles and state
- Mapping to orchestration layer
- High-level lifecycle control

---

# Aggregate Root

MediaPlatformSession

Responsible for:

- Session lifecycle (call/meeting/webinar)
- Participants and roles
- Binding to MediaSession + Orchestrator
- Session-level policies
- Unified session state

---

# Value Objects

MediaPlatformSessionId

ParticipantProfile

ParticipantRole

SessionType

SessionPolicy

SessionStateSnapshot

---

# Entity

MediaPlatformSession

Fields:

- mediaPlatformSessionId
- mediaSessionId
- orchestrationSessionId
- sessionType
- state
- participants
- activePolicies
- createdAt
- updatedAt

---

# Session Types

ONE_TO_ONE_CALL

GROUP_CALL

MEETING

WEBINAR (future)

---

# Participant Roles

HOST

CO_HOST

PARTICIPANT

VIEWER

---

# Session States

CREATED

WAITING_FOR_PARTICIPANTS

ACTIVE

DEGRADED

PAUSED

ENDING

ENDED

---

# Core Relationships

MediaPlatformSession

1 → 1 MediaSession

MediaPlatformSession

1 → 1 MediaOrchestrationSession

MediaPlatformSession

1 → N Participants

---

# State Machine

CREATED
↓
WAITING_FOR_PARTICIPANTS
↓
ACTIVE
↓
(DEGRADED | PAUSED) [optional loops]
↓
ENDING
↓
ENDED

---

# Rules Engine

RULE-001

A session MUST NOT become ACTIVE unless:

- MediaSession is ACTIVE
- MediaOrchestrator is ACTIVE
- At least 1 participant is connected

---

RULE-002

Only HOST can:

- End session
- Change session policy
- Promote roles

---

RULE-003

Screen sharing MUST be controlled at session level, not engine level.

---

RULE-004

Session state MUST reflect aggregated orchestrator health.

---

RULE-005

A session MAY remain ACTIVE even if some participants disconnect.

---

# Session Policies

SessionPolicy defines high-level controls:

- maxParticipants
- allowScreenShare
- recordingEnabled
- autoMuteOnJoin
- videoDefaultState
- networkAdaptationMode

---

# Domain Services

SessionLifecycleService

Responsibilities:

- Start session
- Transition states
- End session

---

ParticipantManagementService

Responsibilities:

- Add/remove participants
- Role assignment
- Connection tracking

---

PolicyEvaluationService

Responsibilities:

- Evaluate session rules
- Apply constraints to orchestrator

---

SessionAggregationService

Responsibilities:

- Combine MediaSession + Orchestrator state
- Produce unified session snapshot

---

# Integration Mapping

Consumes:

MediaSessionActivatedEvent

MediaOrchestrationStartedEvent

PeerConnectionEstablishedEvent

NetworkQualityChangedEvent

ParticipantJoinedEvent

ParticipantLeftEvent

Produces:

MediaPlatformSessionCreatedEvent

MediaPlatformSessionStateChangedEvent

ParticipantRoleUpdatedEvent

SessionPolicyAppliedEvent

MediaPlatformSessionEndedEvent

---

# Cross-Layer Mapping

MediaPlatformSession
→ MediaSession (execution layer)

MediaPlatformSession
→ MediaOrchestrator (decision layer)

MediaPlatformSession
→ Network Layer (connectivity layer)

MediaPlatformSession
→ Engines (execution primitives)

---

# Invariants

INV-001

Platform session MUST NOT exist without MediaSession.

---

INV-002

Orchestrator MUST be bound before session becomes ACTIVE.

---

INV-003

Participants MUST always belong to exactly one active session.

---

INV-004

State MUST be derived, not manually overridden.

---

# Failure Rules

If Orchestrator fails:

Session enters DEGRADED state (not terminated)

---

If Network fails:

Session remains ACTIVE but adapts via policies

---

If MediaSession fails:

Session MUST terminate immediately

---

# Observability

Metrics:

platform_sessions_active

participant_count_per_session

session_state_changes_total

session_policy_changes_total

session_degraded_count

session_duration_ms

---

# Scalability Model

Supports:

- 1:1 calls (low overhead)
- group meetings (SFU-backed scaling)
- webinar mode (read-heavy, broadcast-style)

---

# Completion Criteria

✓ Unified session model defined

✓ State machine implemented

✓ Orchestrator binding validated

✓ Participant lifecycle integrated

✓ Policy system functional

---

End of Document