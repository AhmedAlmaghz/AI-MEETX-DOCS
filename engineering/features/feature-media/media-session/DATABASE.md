# engineering/features/feature-media/media-session/DATABASE.md

Document ID: MEDIA-SESSION-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Media Session

---

# Purpose

Defines the persistence model for Media Session.

Media Session is the Aggregate Root responsible for media connectivity.

---

# Aggregate

MediaSession

↓

SessionCapabilities

TransportState

RecoveryState

---

# Primary Entity

MediaSession

| Field | Type | Required |
|--------|------|----------|
| sessionId | UUID | Yes |
| meetingId | UUID | Yes |
| participantId | UUID | Yes |
| state | Enum | Yes |
| transportState | Enum | Yes |
| recoveryState | Enum | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |
| closedAt | Instant? | No |

---

# Value Object

SessionCapabilities

| Field | Type |
|--------|------|
| audioEnabled | Boolean |
| videoEnabled | Boolean |
| screenShareEnabled | Boolean |
| dataChannelEnabled | Boolean |

---

# Value Object

TransportState

| Field | Type |
|--------|------|
| transportStatus | Enum |
| transportProtocol | Enum |
| encryption | Enum |

---

# Value Object

RecoveryState

| Field | Type |
|--------|------|
| reconnectAttempts | Integer |
| lastRecoveryAt | Instant |
| recoveryReason | String |

---

# Repository Contract

MediaSessionRepository

Operations

Create

Update

Close

Recover

FindById

FindByParticipant

FindByMeeting

Exists

---

# Logical Collections

media_sessions

---

# Relationships

Meeting

1

↓

N

MediaSession

Participant

1

↓

1

MediaSession

---

# Cache Strategy

L1

Memory

Current Session

---

L2

Local Cache

Recent Sessions

---

L3

Remote Repository

Persistent State

---

# Synchronization

Create

↓

Persist

↓

Publish Event

↓

Initialize Media Components

---

Recovery

↓

Update State

↓

Publish Event

↓

Resume Transport

---

Close

↓

Persist

↓

Release Resources

↓

Publish Event

---

# Query Patterns

Find Session By Participant

Find Sessions By Meeting

Find Active Sessions

Find Recovering Sessions

---

# Index Recommendations

sessionId

meetingId

participantId

state

createdAt

---

# Consistency Rules

Exactly one active session per participant.

Session state changes SHALL be transactional.

Cross-feature updates SHALL use Eventual Consistency.

---

# Security

Session identifiers SHALL be opaque.

Transport details SHALL remain internal.

Recovery metadata SHALL NOT be exposed externally.

---

# Migration Rules

Schema Version

Integer

Repository update required for breaking schema changes.

---

# Completion Criteria

✓ Persistence implemented

✓ Repository validated

✓ Synchronization verified

✓ Query performance verified

✓ Migration documented

---

End of Document