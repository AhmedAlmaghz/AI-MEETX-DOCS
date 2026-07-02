# engineering/features/feature-media/video-engine/API.md

Document ID: MEDIA-VIDEO-ENGINE-API-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Video Engine

---

# Purpose

Defines the external API contracts for controlling real-time video processing.

This API manages video session lifecycle, resolution, frame rate, and encoding adaptation.

Raw frame processing is handled internally by the Video Engine runtime.

---

# Base Path

/api/v1/media/video

Authorization

Bearer Token Required

---

# Resource

VideoSession

Primary Identifier

videoSessionId (UUID)

---

# Endpoints

---

## Create Video Session

POST /

Creates a video session linked to a Media Session.

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
VideoSessionDto
```

---

## Get Video Session

GET /{videoSessionId}

Returns current video session state.

### Response

200 OK

```text
VideoSessionDto
```

---

## Start Video Processing

POST /{videoSessionId}/start

Starts video capture and processing pipeline.

### Response

200 OK

State:

INITIALIZING → ACTIVE

---

## Pause Video Processing

POST /{videoSessionId}/pause

Pauses video stream without destroying session.

### Response

200 OK

State:

ACTIVE → PAUSED

---

## Resume Video Processing

POST /{videoSessionId}/resume

Resumes video stream from paused state.

### Response

200 OK

State:

PAUSED → ACTIVE

---

## Stop Video Session

DELETE /{videoSessionId}

Terminates video session and releases camera resources.

### Response

204 No Content

State:

ACTIVE/PAUSED → CLOSED

---

## Change Resolution

POST /{videoSessionId}/resolution

Dynamically changes video resolution during runtime.

### Request

```json
{
  "width": 1280,
  "height": 720,
  "adaptiveMode": true
}
```

### Response

200 OK

---

## Change Frame Rate

POST /{videoSessionId}/framerate

Updates frame rate dynamically.

### Request

```json
{
  "targetFps": 30,
  "adaptiveMode": true
}
```

### Response

200 OK

---

## Update Encoding Profile

POST /{videoSessionId}/encoding

Adjusts video encoding parameters.

### Request

```json
{
  "codec": "H264",
  "bitrate": 1500000,
  "compressionLevel": "MEDIUM"
}
```

### Response

200 OK

---

## Get Video Metrics

GET /{videoSessionId}/metrics

Returns real-time performance metrics.

### Response

200 OK

```text
VideoMetricsDto
```

---

# DTOs

---

## VideoSessionDto

```text
videoSessionId

mediaSessionId

participantId

state

resolutionProfile

frameRateProfile

encodingProfile

isActive

createdAt

updatedAt
```

---

## VideoMetricsDto

```text
frameLatencyMs

frameDropRate

bitrate

jitterMs

resolutionStabilityScore

encodingEfficiency
```

---

## ResolutionProfileDto

```text
width

height

adaptiveMode

maxResolution

minResolution
```

---

## FrameRateProfileDto

```text
targetFps

minFps

maxFps

adaptiveMode
```

---

# Validation Rules

---

Create Session

- MediaSession MUST be ACTIVE
- Device MUST be camera-enabled
- Participant MUST exist

---

Start Processing

- Session MUST be INITIALIZING or PAUSED

---

Resolution Change

- Must be supported by device constraints
- Must not interrupt MediaSession

---

Frame Rate Change

- Must not exceed device capabilities
- Must degrade gracefully if overloaded

---

Stop Session

- Always allowed if session exists

---

# Error Codes

VIDEO_SESSION_NOT_FOUND

MEDIA_SESSION_NOT_ACTIVE

DEVICE_NOT_AVAILABLE

UNSUPPORTED_RESOLUTION

UNSUPPORTED_FRAMERATE

INVALID_VIDEO_STATE

UNAUTHORIZED

SERVER_ERROR

---

# Retry Policy

GET

Safe retry allowed

POST

Retry only for idempotent operations

DELETE

No retry

---

# Security

Video API SHALL NOT expose:

- Raw frame buffers
- Camera hardware identifiers
- Codec internals
- OS capture APIs

Only processed metadata is exposed.

---

# Audit

Audit events SHALL be generated for:

- Session lifecycle changes
- Resolution changes
- Frame rate changes
- Encoding updates
- Metrics retrieval (optional)

---

# Performance Targets

Start video processing:

< 3 seconds

Resolution switch:

< 500 ms

Frame rate update:

< 300 ms

Metrics retrieval:

< 200 ms

---

# Completion Criteria

✓ API implemented

✓ DTOs validated

✓ State transitions enforced

✓ Adaptive controls working

✓ Security applied

✓ Tests passing

---

End of Document