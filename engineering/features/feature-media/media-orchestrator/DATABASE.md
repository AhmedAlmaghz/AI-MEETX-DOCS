# engineering/features/feature-media/media-orchestrator/DATABASE.md

Document ID: MEDIA-ORCHESTRATOR-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Orchestrator

---

# Purpose

Defines the persistence model for the Media Orchestration layer.

This layer stores global media state, subsystem health, policy decisions, and recovery history.

No raw media data is stored.

---

# Aggregate

MediaOrchestrationSession

↓

GlobalMediaState

SubsystemHealthSnapshot

OrchestrationDecision

PolicyExecutionRecord

RecoveryExecutionRecord

---

# Primary Entity

MediaOrchestrationSession

| Field | Type | Required |
|--------|------|----------|
| orchestrationSessionId | UUID | Yes |
| mediaSessionId | UUID | Yes |
| globalState | Enum | Yes |
| state | Enum | Yes |
| isActive | Boolean | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |

---

# Value Object

GlobalMediaState

| Field | Type |
|--------|------|
| audioState | Enum |
| videoState | Enum |
| screenState | Enum |
| networkState | Enum |

---

# Value Object

SubsystemHealthSnapshot

Represents health of each subsystem at a given time.

| Field | Type |
|--------|------|
| subsystem | Enum (AUDIO / VIDEO / SCREEN / NETWORK) |
| status | Enum (HEALTHY / DEGRADED / FAILED) |
| latencyImpact | Integer |
| errorRate | Float |
| degradationLevel | Integer |
| timestamp | Instant |

---

# Value Object

OrchestrationDecision

Represents every decision made by the orchestrator.

| Field | Type |
|--------|------|
| decisionType | Enum |
| reason | String |
| affectedSubsystems | List |
| actionTaken | String |
| timestamp | Instant |
| correlationId | UUID |

---

# Value Object

PolicyExecutionRecord

Tracks policy evaluations and results.

| Field | Type |
|--------|------|
| policyId | String |
| policyType | String |
| inputState | JSON |
| outputDecision | JSON |
| applied | Boolean |
| timestamp | Instant |

---

# Value Object

RecoveryExecutionRecord

Tracks recovery operations.

| Field | Type |
|--------|------|
| recoveryId | UUID |
| affectedSubsystems | List |
| stepsExecuted | List |
| success | Boolean |
| rollbackPerformed | Boolean |
| durationMs | Integer |
| timestamp | Instant |

---

# Repository Contract

MediaOrchestrationRepository

Operations:

CreateSession

UpdateGlobalState

AppendHealthSnapshot

AppendDecision

AppendPolicyExecution

AppendRecoveryExecution

FindByMediaSession

FindActiveSession

CloseSession

---

# Logical Collections

orchestration_sessions

global_media_state

subsystem_health_snapshots

orchestration_decisions

policy_execution_records

recovery_execution_records

---

# Relationships

MediaSession

1

↓

1

MediaOrchestrationSession

MediaOrchestrationSession

1

↓

N

OrchestrationDecision

MediaOrchestrationSession

1

↓

N

SubsystemHealthSnapshot

MediaOrchestrationSession

1

↓

N

RecoveryExecutionRecord

---

# Cache Strategy

L1

Memory

Active orchestration sessions

---

L2

Local Cache

Latest subsystem health snapshots

---

L3

Persistent Storage

Full decision + recovery history

---

# Synchronization Flow

Session Start

↓

Persist orchestration session

↓

Emit MediaOrchestrationStartedEvent

---

Subsystem State Change

↓

Update GlobalMediaState

↓

Append Health Snapshot

↓

Evaluate Policy

↓

Append Decision

---

Degradation Detected

↓

Create RecoveryExecutionRecord

↓

Execute recovery steps

↓

Persist result

---

Recovery Completed

↓

Update Global State

↓

Emit recovery completion event

---

Session End

↓

Persist final state

↓

Close session

↓

Emit MediaOrchestrationStoppedEvent

---

# Query Patterns

Get Active Orchestration Session

Get Global Media State

Get Subsystem Health Timeline

Get Decision History

Get Recovery History

Get Policy Execution Logs

---

# Index Recommendations

orchestrationSessionId

mediaSessionId

globalState

state

isActive

timestamp (for snapshots & decisions)

---

# Consistency Rules

Only one active MediaOrchestrationSession per MediaSession.

Decisions MUST be append-only (immutable history).

Health snapshots MUST be time-series consistent.

Recovery records MUST reference a valid decision context.

---

# Retention Policy

Decisions:

Long-term retention (analytics + debugging)

Health snapshots:

Aggregatable over time

Recovery logs:

Critical system audit history

---

# Security

Orchestrator data MUST NOT include:

- Raw media streams
- Codec internal states
- Device hardware identifiers
- OS-level network stack data

Only metadata, decisions, and health signals are allowed.

---

# Replay Capability

System MUST support state reconstruction via:

- OrchestrationDecision history
- SubsystemHealthSnapshot timeline
- RecoveryExecutionRecord chain

This enables:

- Debugging
- Incident analysis
- System replay simulation

---

# Migration Rules

Schema changes required when:

- New subsystem types introduced
- New policy engine rules added
- Recovery model evolves

---

# Completion Criteria

✓ Global state persistence implemented

✓ Decision history tracked

✓ Health monitoring stored

✓ Recovery execution recorded

✓ Replay capability supported

---

End of Document