# engineering/features/feature-media/video-engine/DATABASE.md

Document ID: MEDIA-VIDEO-ENGINE-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Video Engine

---

# Purpose

Defines the persistence model for video sessions and adaptive streaming state.

Raw video frames are NEVER stored. Only metadata, metrics, and adaptation history are persisted.

---

# Aggregate

VideoSession

↓

VideoState

ResolutionProfile

FrameRateProfile

EncodingProfile

VideoMetrics

---

# Primary Entity

VideoSession

| Field | Type | Required |
|--------|------|----------|
| videoSessionId | UUID | Yes |
| mediaSessionId | UUID | Yes |
| participantId | UUID | Yes |
| meetingId | UUID | Yes |
| state | Enum | Yes |
| resolutionProfile | JSON | Yes |
| frameRateProfile | JSON | Yes |
| encodingProfile | JSON | Yes |
| isActive | Boolean | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |

---

# Value Object

VideoMetrics

| Field | Type |
|--------|------|
| frameLatencyMs | Integer |
| frameDropRate | Float |
| bitrate | Integer |
| jitterMs | Integer |
| resolutionStabilityScore | Float |
| encodingEfficiency | Float |

---

# Value Object

ResolutionProfile

| Field | Type |
|--------|------|
| width | Integer |
| height | Integer |
| adaptiveMode | Boolean |
| maxResolution | String |
| minResolution | String |

---

# Value Object

FrameRateProfile

| Field | Type |
|--------|------|
| targetFps | Integer |
| minFps | Integer |
| maxFps | Integer |
| adaptiveMode | Boolean |

---

# Value Object

EncodingProfile

| Field | Type |
|--------|------|
| codec | String |
| bitrate | Integer |
| keyframeInterval | Integer |
| compressionLevel | String |

---

# Repository Contract

VideoSessionRepository

Operations:

CreateVideoSession

UpdateVideoSession

FindById

FindByMediaSession

FindByParticipant

FindActiveSessions

UpdateMetrics

UpdateResolutionProfile

UpdateFrameRateProfile

UpdateEncodingProfile

CloseSession

---

# Logical Collections

video_sessions

---

# Relationships

MediaSession

1

↓

1

VideoSession

Participant

1

↓

1

VideoSession

---

# Cache Strategy

L1

Memory

Active Video Sessions

---

L2

Local Cache

Recent Frame Metrics

---

L3

Persistent Storage

Session + Adaptation History

---

# Synchronization Flow

Create Video Session

↓

Persist Session

↓

Emit VideoSessionCreatedEvent

---

Frame Processing Update

↓

Update Metrics

↓

Persist Partial State

↓

Emit VideoMetricsUpdatedEvent

---

Resolution Change

↓

Update Profile

↓

Persist

↓

Emit VideoResolutionChangedEvent

---

Frame Rate Change

↓

Update Profile

↓

Persist

↓

Emit VideoFrameRateChangedEvent

---

Session Close

↓

Persist Final State

↓

Emit VideoSessionClosedEvent

---

# Query Patterns

Find Active Video Session

Get Latest Resolution Profile

Get Frame Rate History

Get Encoding Efficiency Trends

Find Sessions by Participant

---

# Index Recommendations

videoSessionId

mediaSessionId

participantId

state

isActive

updatedAt

---

# Consistency Rules

Only one active VideoSession per participant per MediaSession.

Profile updates MUST be atomic.

Metrics updates MUST be merge-safe.

---

# Retention Policy

Metrics MAY be retained for analytics.

Adaptation history MAY be used for AI optimization later.

Raw frames are NEVER stored.

---

# Security

Video metadata MUST NOT expose:

- Raw frame data
- Camera hardware identifiers
- OS-level capture APIs
- Codec internal buffers

Only abstract performance data is allowed.

---

# Migration Rules

Schema changes required when:

- New codec support added
- New resolution tiers introduced
- Metrics structure evolves

---

# Completion Criteria

✓ Video persistence implemented

✓ Adaptation history tracked

✓ Metrics storage validated

✓ Sync with Media Session verified

✓ Tests passing

---

End of Document