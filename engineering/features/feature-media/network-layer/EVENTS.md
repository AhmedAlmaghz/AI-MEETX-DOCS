# engineering/features/feature-media/network-layer/EVENTS.md

Document ID: MEDIA-NETWORK-LAYER-EVT-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Network Layer & Signaling

---

# Purpose

Defines all domain events produced and consumed by the Network Layer.

The system is fully event-driven and coordinates peer connections, stream negotiation, routing decisions, and recovery flows.

---

# Event Principles

All events SHALL:

- Be immutable
- Include eventId
- Include networkSessionId
- Include mediaSessionId
- Include participantId (if applicable)
- Include timestamp
- Include correlationId
- Include schemaVersion

---

# Aggregate

NetworkSession

Aggregate Identifier:

networkSessionId

---

# Produced Events

---

## NetworkSessionCreatedEvent

Published when a network session is created.

Payload:

```text
networkSessionId
mediaSessionId
createdAt
```

Consumers:

- Media Session
- Signaling Orchestrator
- Monitoring System

---

## SignalingStartedEvent

Published when signaling begins.

Payload:

```text
networkSessionId
timestamp
```

Consumers:

- PeerConnectionService
- StreamNegotiationService
```

---

## PeerConnectionEstablishedEvent

Published when a peer connection is successfully established.

Payload:

```text
networkSessionId
peerId
connectionType
latencyMs
timestamp
```

Consumers:

- RoutingService
- StreamNegotiationService
- UI Layer
```

---

## PeerDisconnectedEvent

Published when a peer disconnects.

Payload:

```text
networkSessionId
peerId
reason
timestamp
```

Consumers:

- Recovery Engine
- RoutingService
- Media Session
```

---

## PeerReconnectedEvent

Published when a peer reconnects.

Payload:

```text
networkSessionId
peerId
recoveryTimeMs
timestamp
```

Consumers:

- StreamNegotiationService
- RoutingService
- UI Layer
```

---

## StreamNegotiationStartedEvent

Published when stream negotiation begins.

Payload:

```text
networkSessionId
peerId
requestedStreams
timestamp
```

Consumers:

- Codec Resolver
- StreamNegotiationService
```

---

## StreamNegotiationCompletedEvent

Published when streams are successfully negotiated.

Payload:

```text
networkSessionId
peerId
streams
codec
timestamp
```

Consumers:

- Media Engines (Audio/Video/Screen)
- RoutingService
```

---

## NetworkQualityChangedEvent

Published when network conditions change.

Payload:

```text
networkSessionId
latencyMs
packetLossRate
jitterMs
bandwidthEstimate
timestamp
```

Consumers:

- Adaptive Engines (Audio/Video/Screen)
- RoutingService
- Congestion Controller
```

---

## RoutingChangedEvent

Published when routing topology changes.

Payload:

```text
networkSessionId
previousTopology
newTopology
reason
affectedPeers
timestamp
```

Consumers:

- StreamRouter
- Media Engines
- Monitoring System
```

---

## NetworkDegradedEvent

Published when network performance drops.

Payload:

```text
networkSessionId
degradationLevel
reason
impactScope
timestamp
```

Consumers:

- Adaptive Engines
- UI Layer
- Recovery Engine
```

---

## NetworkRecoveredEvent

Published when network stabilizes.

Payload:

```text
networkSessionId
recoveryLevel
restoredBandwidth
timestamp
```

Consumers:

- Adaptive Engines
- RoutingService
- UI Layer
```

---

## StreamRoutingUpdatedEvent

Published when stream routing changes.

Payload:

```text
networkSessionId
streamType
previousRoute
newRoute
timestamp
```

Consumers:

- Media Engines
- Stream Router
```

---

## NetworkSessionClosedEvent

Published when network session ends.

Payload:

```text
networkSessionId
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

Initialize signaling flow.

---

## MediaSessionClosedEvent

Action:

Terminate all peer connections.

---

## AudioSessionCreatedEvent

Action:

Register audio stream for negotiation.

---

## VideoSessionCreatedEvent

Action:

Register video stream.

---

## ScreenShareSessionCreatedEvent

Action:

Register screen share stream.

---

## DevicePermissionRevokedEvent

Action:

Trigger peer stream renegotiation.

---

# Event Ordering Rules

MediaSessionActivatedEvent

↓

NetworkSessionCreatedEvent

↓

SignalingStartedEvent

↓

PeerConnectionEstablishedEvent

↓

StreamNegotiationStartedEvent

↓

StreamNegotiationCompletedEvent

↓

NetworkQualityChangedEvent (continuous)

↓

RoutingChangedEvent (optional)

↓

NetworkSessionClosedEvent

---

# Delivery Guarantees

At Least Once Delivery

All consumers MUST be idempotent.

Duplicate events MUST NOT break connection consistency.

---

# Failure Policy

If event publishing fails:

Persist locally

↓

Retry asynchronously

↓

Log failure

Network operations MUST continue uninterrupted.

---

# Real-Time Behavior

NetworkQualityChangedEvent:

- MAY be emitted every 200ms–2s depending on network changes

RoutingChangedEvent:

- MUST be debounced to avoid oscillation

Peer events:

- MUST be delivered with high priority

---

# Security Rules

Network Layer events SHALL NOT include:

- Raw media payloads
- Codec internal states
- OS-level networking stack data
- Device hardware identifiers

Only metadata, topology, and stream descriptors are allowed.

---

# Observability

Metrics:

network_events_emitted_total

peer_connection_events_total

stream_negotiation_events_total

routing_changes_total

network_degradation_events_total

network_recovery_events_total

event_delivery_latency_ms

---

# Completion Criteria

✓ Event system implemented

✓ Peer lifecycle fully tracked

✓ Stream negotiation events validated

✓ Routing adaptation working

✓ Recovery flows verified

---

End of Document