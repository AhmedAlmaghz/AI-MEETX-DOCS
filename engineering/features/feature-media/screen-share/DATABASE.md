# engineering/features/feature-media/screen-share/DATABASE.md

Document ID: MEDIA-SCREEN-SHARE-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Screen Share Engine

---

# Purpose

Defines the persistence model for screen sharing sessions.

Stores only metadata, capture behavior, optimization metrics, and session state.

Raw screen frames are NEVER persisted.

---

# Aggregate

ScreenShareSession

↓

ScreenState

CaptureProfile

ScreenMetrics

CaptureHistory

---

# Primary Entity

ScreenShareSession

| Field | Type | Required |
|--------|------|----------|
| screenShareSessionId | UUID | Yes |
| mediaSessionId | UUID | Yes |
| participantId | UUID | Yes |
| meetingId | UUID | Yes |
| state | Enum | Yes |
| captureSource | Enum | Yes |
| captureRegion | JSON | No |
| captureProfile | JSON | Yes |
| isActive | Boolean | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |

---

# Value Object

CaptureProfile

| Field | Type |
|--------|------|
| fps | Integer |
| resolutionWidth | Integer |
| resolutionHeight | Integer |
| adaptiveMode | Boolean |
| optimizationEnabled | Boolean |
| deltaCompressionEnabled | Boolean |

---

# Value Object

ScreenMetrics

| Field | Type |
|--------|------|
| frameCaptureLatencyMs | Integer |
| frameDiffRatio | Float |
| fps | Integer |
| cpuUsage | Float |
| bandwidthEstimate | Integer |
| droppedFrames | Integer |

---

# Value Object

CaptureRegion

| Field | Type |
|--------|------|
| x | Integer |
| y | Integer |
| width | Integer |
| height | Integer |

---

# Value Object

CaptureHistory

Represents adaptive behavior over time.

| Field | Type |
|--------|------|
| timestamp | Instant |
| source | Enum |
| fps | Integer |
| resolution | String |
| reason | String |

---

# Repository Contract

ScreenShareRepository

Operations:

CreateSession

UpdateSession

FindById

FindByMediaSession

FindByParticipant

UpdateCaptureProfile

UpdateMetrics

AppendCaptureHistory

CloseSession

---

# Logical Collections

screen_share_sessions

---

# Relationships

MediaSession

1

↓

1

ScreenShareSession

Participant

1

↓

1

ScreenShareSession

---

# Cache Strategy

L1

Memory

Active Screen Share Sessions

---

L2

Local Cache

Recent Capture Metrics

---

L3

Persistent Storage

Session + Capture History

---

# Synchronization Flow

Create Screen Share Session

↓

Persist Session

↓

Emit ScreenShareSessionCreatedEvent

---

Frame Capture Update

↓

Update Metrics

↓

Persist partial state

↓

Emit ScreenMetricsUpdatedEvent

---

Source Switch

↓

Update Capture Profile

↓

Append History Entry

↓

Emit ScreenSourceChangedEvent

---

Session Close

↓

Persist final state

↓

Emit ScreenShareSessionClosedEvent

---

# Query Patterns

Find Active Screen Share Session

Get Capture History

Get Frame Diff Trends

Get FPS Evolution Over Time

Find Sessions by Participant

---

# Index Recommendations

screenShareSessionId

mediaSessionId

participantId

state

captureSource

isActive

updatedAt

---

# Consistency Rules

Only one active ScreenShareSession per participant per MediaSession.

Capture region updates MUST be atomic.

Metrics updates MUST be merge-safe.

---

# Retention Policy

Capture history MAY be used for optimization analytics.

Metrics MAY be used for adaptive AI tuning later.

No raw screen data is stored.

---

# Security

ScreenShare metadata MUST NOT expose:

- OS framebuffer data
- Protected UI layers
- System-level overlays
- Hardware capture internals

Only abstracted capture metrics are allowed.

---

# Migration Rules

Schema changes required when:

- New capture source types added
- New optimization strategies introduced
- Metrics structure evolves

---

# Completion Criteria

✓ Session persistence implemented

✓ Capture metrics tracked

✓ History logging validated

✓ Sync with Media Session verified

✓ Tests passing

---

End of Document