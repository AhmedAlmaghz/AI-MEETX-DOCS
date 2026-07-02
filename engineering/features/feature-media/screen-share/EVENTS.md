# engineering/features/feature-media/screen-share/EVENTS.md

Document ID: MEDIA-SCREEN-SHARE-EVT-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Screen Share Engine

---

# Purpose

Defines all domain events produced and consumed by the Screen Share Engine.

The system operates as a reactive capture pipeline driven by Media Session, Device permissions, and network conditions.

---

# Event Principles

All events SHALL:

- Be immutable
- Include eventId
- Include screenShareSessionId
- Include mediaSessionId
- Include participantId
- Include timestamp
- Include correlationId
- Include schemaVersion

---

# Aggregate

Aggregate Type

ScreenShareSession

Aggregate Identifier

screenShareSessionId

---

# Produced Events

---

## ScreenShareSessionCreatedEvent

Published when a screen share session is created.

Payload:

```text
screenShareSessionId
mediaSessionId
participantId
createdAt
```

Consumers:

- Media Session
- UI Layer
- Monitoring System

---

## ScreenCaptureStartedEvent

Published when screen capture begins.

Payload:

```text
screenShareSessionId
sourceType
initialFps
initialResolution
startedAt
```

Consumers:

- UI Layer
- Network Layer
- Analytics Engine

---

## ScreenSourceChangedEvent

Published when capture source changes (SCREEN / WINDOW / REGION).

Payload:

```text
screenShareSessionId
previousSource
newSource
windowId
region
timestamp
```

Consumers:

- UI Layer
- Adaptive Engine
- Analytics Engine
```

---

## ScreenRegionUpdatedEvent

Published when capture region changes dynamically.

Payload:

```text
screenShareSessionId
previousRegion
newRegion
timestamp
```

Consumers:

- UI Layer
- Optimization Engine
```

---

## ScreenSettingsUpdatedEvent

Published when FPS or resolution changes.

Payload:

```text
screenShareSessionId
previousFps
newFps
previousResolution
newResolution
adaptiveMode
timestamp
```

Consumers:

- Adaptive Engine
- Network Layer
- UI Layer
```

---

## ScreenFrameOptimizedEvent

Published when frame diff optimization is applied.

Payload:

```text
screenShareSessionId
frameDiffRatio
optimizationLevel
bandwidthSaved
timestamp
```

Consumers:

- Network Layer
- Performance Engine
- Analytics Engine
```

---

## ScreenQualityDegradedEvent

Published when system reduces capture quality.

Payload:

```text
screenShareSessionId
degradationLevel
reason
currentFps
currentResolution
timestamp
```

Consumers:

- UI Layer
- Media Session
- Adaptive Engine
```

---

## ScreenRecoveredEvent

Published when quality is restored.

Payload:

```text
screenShareSessionId
recoveryLevel
restoredFps
restoredResolution
timestamp
```

Consumers:

- UI Layer
- Analytics Engine
```

---

## ScreenMetricsUpdatedEvent

Published periodically or on significant changes.

Payload:

```text
screenShareSessionId
frameCaptureLatencyMs
frameDiffRatio
fps
cpuUsage
bandwidthEstimate
droppedFrames
timestamp
```

Consumers:

- Monitoring System
- AI Optimization Engine
- Analytics Engine
```

---

## ScreenShareSessionClosedEvent

Published when session ends.

Payload:

```text
screenShareSessionId
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

Initialize Screen Share session readiness.

---

## MediaSessionClosedEvent

Action:

Stop all screen capture immediately.

---

## DevicePermissionGrantedEvent

Action:

Allow screen capture start.

---

## DevicePermissionRevokedEvent

Action:

Force stop capture.

---

## NetworkQualityChangedEvent

Action:

Trigger adaptive FPS/resolution changes.

---

# Event Ordering Rules

MediaSessionActivatedEvent

↓

ScreenShareSessionCreatedEvent

↓

ScreenCaptureStartedEvent

↓

ScreenMetricsUpdatedEvent (stream loop)

↓

ScreenFrameOptimizedEvent (optional loop)

↓

ScreenSettingsUpdatedEvent (optional)

↓

ScreenQualityDegradedEvent (optional)

↓

ScreenRecoveredEvent (optional)

↓

ScreenShareSessionClosedEvent

---

# Delivery Guarantees

At Least Once Delivery

All consumers MUST be idempotent.

Duplicate events MUST NOT break capture consistency.

---

# Failure Policy

If event publishing fails:

Persist locally

↓

Retry asynchronously

↓

Log failure

Screen capture MUST continue unaffected.

---

# Real-Time Behavior

ScreenMetricsUpdatedEvent:

- MAY be emitted every 500ms–2s depending on CPU/network
- MUST be throttled under high load

Frame optimization events:

- MUST be debounced to avoid spam

---

# Security Rules

Screen Share events SHALL NOT include:

- Raw framebuffer data
- OS UI layers
- Protected system regions
- Hardware capture APIs

Only abstract capture metrics and state transitions.

---

# Observability

Metrics:

screen_events_emitted_total

screen_source_change_total

screen_region_update_total

screen_fps_change_total

screen_quality_degradation_total

screen_frame_optimization_total

screen_session_latency

---

# Completion Criteria

✓ Event system implemented

✓ Media Session integration verified

✓ Capture pipeline validated

✓ Optimization flow working

✓ Metrics streaming verified

---

End of Document