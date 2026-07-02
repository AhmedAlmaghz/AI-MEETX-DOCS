# engineering/features/feature-media/network-layer/API.md

Document ID: MEDIA-NETWORK-LAYER-API-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Network Layer & Signaling

---

# Purpose

Defines external API contracts for real-time network orchestration.

This API manages peer connections, signaling, stream negotiation, routing updates, and reconnection flows.

---

# Base Path

/api/v1/media/network

Authorization

Bearer Token Required

---

# Resource

NetworkSession

Primary Identifier

networkSessionId (UUID)

---

# Endpoints

---

## Create Network Session

POST /

Creates a network session for a Media Session.

### Request

```json
{
  "mediaSessionId": "...",
  "participantId": "..."
}
```

### Response

201 Created

```text
NetworkSessionDto
```

---

## Get Network Session

GET /{networkSessionId}

Returns current network session state.

---

## Start Signaling

POST /{networkSessionId}/signaling/start

Initializes signaling handshake.

State:

CREATED → SIGNALING

---

## Establish Peer Connection

POST /{networkSessionId}/peers/connect

Establishes a peer connection.

### Request

```json
{
  "peerId": "...",
  "connectionType": "P2P"
}
```

---

## Negotiate Streams

POST /{networkSessionId}/streams/negotiate

Negotiates available media streams.

### Request

```json
{
  "peerId": "...",
  "streams": ["AUDIO", "VIDEO", "SCREEN_SHARE"]
}
```

---

## Update Network Metrics

POST /{networkSessionId}/metrics

Updates real-time network conditions.

### Request

```json
{
  "latencyMs": 120,
  "packetLossRate": 0.02,
  "jitterMs": 15,
  "bandwidthEstimate": 2500000
}
```

---

## Update Routing

POST /{networkSessionId}/routing

Updates routing strategy.

### Request

```json
{
  "topologyType": "SFU",
  "reason": "HIGH_LOAD",
  "affectedPeers": ["peer1", "peer2"]
}
```

---

## Handle Peer Disconnect

POST /{networkSessionId}/peers/disconnect

Marks peer as disconnected and triggers recovery flow.

---

## Handle Peer Reconnect

POST /{networkSessionId}/peers/reconnect

Restores peer connection and renegotiates streams.

---

## Get Peer State

GET /{networkSessionId}/peers/{peerId}

Returns connection state and metrics.

---

## Get Stream State

GET /{networkSessionId}/streams

Returns all negotiated streams.

---

## Get Routing State

GET /{networkSessionId}/routing

Returns current routing topology and history.

---

## Close Network Session

DELETE /{networkSessionId}

Terminates network session and all peer connections.

State:

ANY → CLOSED

---

# DTOs

---

## NetworkSessionDto

```text
networkSessionId

mediaSessionId

state

routingProfile

isActive

createdAt

updatedAt
```

---

## PeerConnectionDto

```text
peerId

connectionState

latencyMs

packetLossRate

jitterMs

lastSeen
```

---

## StreamDescriptorDto

```text
streamType

codec

bitrate

resolution

fps

active
```

---

## NetworkMetricsDto

```text
avgLatencyMs

packetLossRate

jitterMs

bandwidthEstimate

activeConnections
```

---

# Validation Rules

---

Create Session

- MediaSession MUST be ACTIVE
- Participant MUST exist

---

Signaling Start

- Session MUST be CREATED

---

Peer Connect

- Peer MUST be valid and authenticated
- Session MUST be in SIGNALING or CONNECTED

---

Stream Negotiation

- Must match supported capabilities
- Must complete before streaming begins

---

Routing Update

- Must not break active streams
- Must preserve session continuity

---

Peer Disconnect

- Must trigger state update and recovery flow

---

# Error Codes

NETWORK_SESSION_NOT_FOUND

MEDIA_SESSION_NOT_ACTIVE

PEER_NOT_FOUND

INVALID_STREAM_CONFIGURATION

SIGNALING_NOT_INITIALIZED

ROUTING_UPDATE_FAILED

UNAUTHORIZED

SERVER_ERROR

---

# Retry Policy

GET

Safe retry allowed

POST

Retry only idempotent operations

DELETE

No retry

---

# Security

Network API MUST NOT expose:

- Raw media payloads
- Codec internals
- OS network stack details
- Device hardware identifiers

Only metadata and control signals are exposed.

---

# Audit

Audit events SHALL be generated for:

- Signaling start
- Peer connection changes
- Stream negotiation
- Routing updates
- Peer disconnect/reconnect
- Session closure

---

# Performance Targets

Signaling start:

< 100ms

Peer connection:

< 2 seconds

Stream negotiation:

< 500ms

Reconnection:

< 3 seconds

Routing update:

< 300ms

---

# Completion Criteria

✓ API implemented

✓ Peer lifecycle working

✓ Stream negotiation functional

✓ Routing updates stable

✓ Reconnection flows verified

✓ Security enforced

---

End of Document