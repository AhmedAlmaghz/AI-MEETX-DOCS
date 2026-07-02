# engineering/features/feature-media/network-layer/DATABASE.md

Document ID: MEDIA-NETWORK-LAYER-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Network Layer & Signaling

---

# Purpose

Defines the persistence model for real-time network sessions.

Stores peer connections, stream negotiation states, routing decisions, and network health metrics.

No raw media data is stored.

---

# Aggregate

NetworkSession

↓

PeerConnection

StreamDescriptor

NetworkMetrics

RoutingDecision

ConnectionHistory

---

# Primary Entity

NetworkSession

| Field | Type | Required |
|--------|------|----------|
| networkSessionId | UUID | Yes |
| mediaSessionId | UUID | Yes |
| state | Enum | Yes |
| routingProfile | JSON | Yes |
| isActive | Boolean | Yes |
| createdAt | Instant | Yes |
| updatedAt | Instant | Yes |

---

# Value Object

PeerConnection

| Field | Type |
|--------|------|
| peerId | UUID |
| connectionState | Enum |
| latencyMs | Integer |
| packetLossRate | Float |
| jitterMs | Integer |
| lastSeen | Instant |

---

# Value Object

StreamDescriptor

| Field | Type |
|--------|------|
| streamType | Enum |
| codec | String |
| bitrate | Integer |
| resolution | String |
| fps | Integer |
| active | Boolean |

---

# Value Object

NetworkMetrics

| Field | Type |
|--------|------|
| avgLatencyMs | Integer |
| packetLossRate | Float |
| jitterMs | Integer |
| bandwidthEstimate | Integer |
| activeConnections | Integer |

---

# Value Object

RoutingDecision

Represents how traffic is routed in the system.

| Field | Type |
|--------|------|
| topologyType | Enum (MESH / SFU / HYBRID) |
| reason | String |
| timestamp | Instant |
| affectedPeers | List |

---

# Value Object

ConnectionHistory

| Field | Type |
|--------|------|
| timestamp | Instant |
| eventType | String |
| previousState | String |
| newState | String |
| reason | String |

---

# Repository Contract

NetworkSessionRepository

Operations:

CreateSession

UpdateSession

FindById

FindByMediaSession

UpdatePeerConnection

UpdateStreamDescriptor

UpdateMetrics

AppendRoutingDecision

AppendConnectionHistory

CloseSession

---

# Logical Collections

network_sessions

peer_connections

stream_descriptors

routing_decisions

connection_history

---

# Relationships

MediaSession

1

↓

1

NetworkSession

NetworkSession

1

↓

N

PeerConnections

NetworkSession

1

↓

N

StreamDescriptors

---

# Cache Strategy

L1

Memory

Active Network Sessions

---

L2

Local Cache

Peer connection states

---

L3

Persistent Storage

Routing decisions + history

---

# Synchronization Flow

Create Network Session

↓

Persist Session

↓

Emit NetworkSessionCreatedEvent

---

Peer Connect

↓

Persist Connection

↓

Append History

↓

Emit PeerConnectionEstablishedEvent

---

Stream Negotiation Complete

↓

Store Stream Descriptor

↓

Emit StreamNegotiationCompletedEvent

---

Network Change Detected

↓

Update Metrics

↓

Possibly Update Routing Decision

↓

Emit NetworkQualityChangedEvent

---

Peer Disconnect

↓

Update State

↓

Append History

↓

Emit PeerDisconnectedEvent

---

# Query Patterns

Find Active Network Sessions

Get Peer Connection State

Get Stream Negotiation History

Get Routing Evolution Over Time

Get Network Health Trends

---

# Index Recommendations

networkSessionId

mediaSessionId

peerId

state

isActive

updatedAt

---

# Consistency Rules

Each MediaSession MUST have at most one active NetworkSession.

Peer state updates MUST be atomic.

Routing decisions MUST be append-only (immutable history).

---

# Retention Policy

Connection history MAY be used for analytics.

Routing decisions MUST be preserved for optimization learning.

Metrics MAY be aggregated over time.

No raw media data is stored.

---

# Security

Network data MUST NOT expose:

- Raw media payloads
- Codec internals
- OS-level network stack data
- Device hardware identifiers

Only abstract network telemetry is allowed.

---

# Migration Rules

Schema changes required when:

- New topology types added (e.g. hybrid SFU enhancements)
- New stream types introduced
- Metrics model evolves

---

# Completion Criteria

✓ Network persistence implemented

✓ Peer tracking validated

✓ Routing history stored

✓ Stream descriptors tracked

✓ Metrics persistence verified

---

End of Document