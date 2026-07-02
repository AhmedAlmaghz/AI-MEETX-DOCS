# engineering/features/feature-media/video-engine/EVENTS.md

Document ID: MEDIA-VIDEO-ENGINE-EVT-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Video Engine

---

# Purpose

Defines all domain events produced and consumed by the Video Engine.

The Video Engine operates as a reactive adaptive system driven by Media Session, Device, and Network conditions.

---

# Event Principles

All events SHALL:

- Be immutable
- Include eventId
- Include videoSessionId
- Include mediaSessionId
- Include participantId
- Include timestamp
- Include correlationId
- Include schemaVersion

---

# Aggregate

Aggregate Type

VideoSession

Aggregate Identifier

videoSessionId

---

# Produced Events

---

## VideoSessionCreatedEvent

Published when a video session is created.

Payload:

```text
videoSessionId
mediaSessionId
participantId
createdAt
```

Consumers:

- Media Session
- UI Layer
- Monitoring System

---

## VideoProcessingStartedEvent

Published when video pipeline starts.

Payload:

```text
videoSessionId
startedAt
initialResolution
initialFps
```

Consumers:

- UI Layer
- Network Layer
- Analytics Engine

---

## VideoResolutionChangedEvent

Published when resolution changes dynamically.

Payload:

```text
videoSessionId
previousResolution
newResolution
reason
timestamp
```

Consumers:

- UI Layer
- Network Adaptation Layer
- Analytics Engine
- AI Optimization Layer (future)

---

## VideoFrameRateChangedEvent

Published when FPS changes.

Payload:

```text
videoSessionId
previousFps
newFps
reason
timestamp
```

Consumers:

- UI Layer
- Performance Engine
- Analytics Engine
```

---

## VideoEncodingChangedEvent

Published when encoding profile changes.

Payload:

```text
videoSessionId
previousCodec
newCodec
bitrate
compressionLevel
timestamp
```

Consumers:

- Network Layer
- Adaptive Streaming Engine
- Monitoring System
```

---

## VideoQualityDegradedEvent

Published when system reduces video quality.

Payload:

```text
videoSessionId
degradationLevel
reason
currentResolution
currentFps
timestamp
```

Consumers:

- UI Layer
- Media Session
- Adaptive Engine
- UX Feedback System
```

---

## VideoRecoveredEvent

Published when video quality is restored.

Payload:

```text
videoSessionId
recoveryLevel
restoredResolution
restoredFps
timestamp
```

Consumers:

- UI Layer
- Media Session
- Analytics Engine
```

---

## VideoFrameDroppedEvent

Published when frame loss is detected.

Payload:

```text
videoSessionId
droppedFrames
dropRate
reason
timestamp
```

Consumers:

- Performance Engine
- Network Layer
- Adaptive Engine
```

---

## VideoMetricsUpdatedEvent

Published periodically or on significant changes.

Payload:

```text
videoSessionId
frameLatencyMs
frameDropRate
bitrate
jitterMs
resolutionStabilityScore
encodingEfficiency
timestamp
```

Consumers:

- Monitoring System
- AI Optimization Layer
- Analytics Engine
```

---

## VideoSessionClosedEvent

Published when video session ends.

Payload:

```text
videoSessionId
closedAt
reason
finalMetrics
```

Consumers:

- Media Session
- Cleanup Services
- Analytics Engine
```

---

# Consumed Events

---

## MediaSessionActivatedEvent

Action:

Initialize Video Session.

---

## MediaSessionClosedEvent

Action:

Stop all video processing.

---

## DeviceSelectedEvent

Action:

Bind video stream to selected camera.

---

## DeviceUnavailableEvent

Action:

Trigger fallback or degradation.

---

## DeviceSwitchedEvent

Action:

Hot-swap video input source.

---

## NetworkQualityChangedEvent

Action:

Trigger adaptive resolution/FPS changes.

---

# Event Ordering Rules

MediaSessionActivatedEvent

↓

VideoSessionCreatedEvent

↓

VideoProcessingStartedEvent

↓

VideoMetricsUpdatedEvent (stream loop)

↓

VideoResolutionChangedEvent (optional)

↓

VideoFrameRateChangedEvent (optional)

↓

VideoQualityDegradedEvent (optional)

↓

VideoRecoveredEvent (optional)

↓

VideoSessionClosedEvent

---

# Delivery Guarantees

At Least Once Delivery

All consumers MUST be idempotent.

Duplicate events MUST NOT break stream consistency.

---

# Failure Policy

If event publishing fails:

Persist locally

↓

Retry asynchronously

↓

Log failure

Video processing MUST continue without interruption.

---

# Real-Time Behavior

VideoMetricsUpdatedEvent:

- MAY be emitted every 500ms–2s depending on load
- MUST be throttled under CPU pressure

Resolution/FPS changes:

- MUST be debounced to prevent oscillation

---

# Security Rules

Video events SHALL NOT include:

- Raw frames
- Camera hardware identifiers
- Codec internals
- OS-level capture APIs

Only abstract metrics and state changes are allowed.

---

# Observability

Metrics:

video_events_emitted_total

video_resolution_change_total

video_fps_change_total

video_quality_degradation_total

video_frame_drop_total

video_session_event_latency

---

# Completion Criteria

✓ Event system implemented

✓ Media Session integration verified

✓ Device binding working

✓ Adaptive engine validated

✓ Metrics streaming verified

---

End of Document