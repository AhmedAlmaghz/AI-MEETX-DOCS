# engineering/features/feature-media/media-platform/DATABASE.md

Document ID: MEDIA-PLATFORM-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Platform Shell

---

# Purpose

Defines the persistence model for Media Platform Sessions.

This layer stores user-facing session state, participant lifecycle history, role changes, and session-level snapshots.

No media data is stored.

---

# Aggregate

MediaPlatformSession

↓

ParticipantRecord

SessionStateSnapshot

RoleChangeRecord

SessionLifecycleEvent

PolicyApplicationRecord

---

# Primary Entity

MediaPlatformSession

| Field | Type | Required |
|--------|------|----------|
| mediaPlatformSessionId | UUID | Yes |
| mediaSessionId | UUID | Yes |
| orchestrationSessionId | UUID | Yes |
| sessionType | Enum | Yes |
| state | Enum | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |
| endedAt | Instant | No |

---

# Value Object

ParticipantRecord

| Field | Type |
|--------|------|
| participantId | UUID |
| displayName | String |
| role | Enum (HOST / CO_HOST / PARTICIPANT / VIEWER) |
| joinedAt | Instant |
| leftAt | Instant |
| connectionState | Enum |

---

# Value Object

SessionStateSnapshot

Represents full session state at a point in time.

| Field | Type |
|--------|------|
| state | Enum |
| activeParticipants | Integer |
| networkHealth | Enum |
| orchestratorState | Enum |
| timestamp | Instant |

---

# Value Object

RoleChangeRecord

| Field | Type |
|--------|------|
| participantId | UUID |
| previousRole | Enum |
| newRole | Enum |
| changedBy | UUID |
| timestamp | Instant |

---

# Value Object

SessionLifecycleEvent

| Field | Type |
|--------|------|
| eventType | Enum |
| reason | String |
| triggeredBy | UUID |
| timestamp | Instant |

---

# Value Object

PolicyApplicationRecord

| Field | Type |
|--------|------|
| policyId | String |
| policyType | String |
| appliedAt | Instant |
| result | String |
| sessionImpact | String |

---

# Repository Contract

MediaPlatformSessionRepository

Operations:

CreateSession

UpdateSessionState

AddParticipant

RemoveParticipant

UpdateParticipantRole

AppendStateSnapshot

AppendLifecycleEvent

AppendRoleChange

ApplyPolicyRecord

FindActiveSession

FindByParticipant

CloseSession

---

# Logical Collections

media_platform_sessions

participants

session_state_snapshots

role_change_records

session_lifecycle_events

policy_application_records

---

# Relationships

MediaPlatformSession

1

↓

N

ParticipantRecord

MediaPlatformSession

1

↓

N

SessionStateSnapshot

MediaPlatformSession

1

↓

N

RoleChangeRecord

MediaPlatformSession

1

↓

N

SessionLifecycleEvent

---

# State Persistence Strategy

Real-time state is NOT overwritten.

Instead:

- Snapshots are appended
- State is derived from latest snapshot
- History is fully replayable

---

# Synchronization Flow

Session Created

↓

Persist MediaPlatformSession

↓

Append SessionLifecycleEvent

↓

Emit MediaPlatformSessionCreatedEvent

---

Participant Joins

↓

Append ParticipantRecord

↓

Append LifecycleEvent

↓

Emit ParticipantJoinedEvent

---

Role Change

↓

Append RoleChangeRecord

↓

Append LifecycleEvent

↓

Emit ParticipantRoleUpdatedEvent

---

State Change

↓

Append SessionStateSnapshot

↓

Update derived state cache

---

Session Ends

↓

Finalize ParticipantRecords

↓

Append LifecycleEvent

↓

Persist final snapshot

↓

Mark session closed

---

# Query Patterns

Get Active Sessions

Get Participants of Session

Get Role History of Participant

Get Session Timeline

Get State Evolution Over Time

Get Policy Impact History

---

# Index Recommendations

mediaPlatformSessionId

mediaSessionId

participantId

state

timestamp (for snapshots/events)

---

# Consistency Rules

Session MUST have immutable lifecycle history.

Participants MUST be traceable across full session lifecycle.

Role changes MUST be append-only.

Snapshots MUST reflect consistent orchestration state.

---

# Retention Policy

Sessions:

Long-term retention (analytics, replay, debugging)

Snapshots:

Aggregated over time for performance

Events:

Full audit history

---

# Replay Capability

System MUST support full session replay via:

- SessionLifecycleEvent
- SessionStateSnapshot
- RoleChangeRecord

Enables:

- Debugging
- Incident reconstruction
- UX simulation testing

---

# Security

Platform data MUST NOT include:

- Media payloads
- Codec-level details
- Network stack internals
- Device hardware identifiers

Only session metadata and user-level state is stored.

---

# Performance Requirements

Write latency:

< 50ms

Snapshot append:

< 30ms

Query active session:

< 100ms

---

# Scalability

Supports:

- Millions of sessions (historical storage)
- High-frequency participant updates
- Real-time snapshot streaming

---

# Completion Criteria

✓ Session persistence implemented

✓ Participant lifecycle stored

✓ Role changes tracked

✓ State snapshots enabled

✓ Replay capability supported

---

End of Document