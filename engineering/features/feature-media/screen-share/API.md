# engineering/features/feature-media/screen-share/API.md

Document ID: MEDIA-SCREEN-SHARE-API-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Screen Share Engine

---

# Purpose

Defines external API contracts for controlling real-time screen sharing.

This API manages capture lifecycle, source switching, region updates, and adaptive streaming control.

---

# Base Path

/api/v1/media/screen-share

Authorization

Bearer Token Required

---

# Resource

ScreenShareSession

Primary Identifier

screenShareSessionId (UUID)

---

# Endpoints

---

## Create Screen Share Session

POST /

Creates a screen share session linked to a Media Session.

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
ScreenShareSessionDto
```

---

## Get Screen Share Session

GET /{screenShareSessionId}

Returns current screen share session state.

---

## Start Screen Capture

POST /{screenShareSessionId}/start

Starts screen capture pipeline.

State:

INITIALIZING → ACTIVE

---

## Pause Screen Capture

POST /{screenShareSessionId}/pause

Pauses capture without releasing OS resources.

State:

ACTIVE → PAUSED

---

## Resume Screen Capture

POST /{screenShareSessionId}/resume

Resumes capture from paused state.

State:

PAUSED → ACTIVE

---

## Stop Screen Share Session

DELETE /{screenShareSessionId}

Stops capture and releases resources.

State:

ACTIVE/PAUSED → CLOSED

---

## Switch Capture Source

POST /{screenShareSessionId}/source

Switch between SCREEN / WINDOW / REGION.

### Request

```json
{
  "sourceType": "WINDOW",
  "windowId": "optional",
  "region": {
    "x": 0,
    "y": 0,
    "width": 1280,
    "height": 720
  }
}
```

---

## Update Capture Region

POST /{screenShareSessionId}/region

Updates region dynamically during active session.

### Request

```json
{
  "x": 100,
  "y": 200,
  "width": 800,
  "height": 600
}
```

---

## Update Capture Settings

POST /{screenShareSessionId}/settings

Controls FPS and resolution.

### Request

```json
{
  "fps": 30,
  "resolutionWidth": 1280,
  "resolutionHeight": 720,
  "adaptiveMode": true,
  "deltaCompressionEnabled": true
}
```

---

## Get Screen Metrics

GET /{screenShareSessionId}/metrics

Returns real-time capture performance data.

---

### Response

```text
ScreenMetricsDto
```

---

## Get Capture History

GET /{screenShareSessionId}/history

Returns adaptive changes over time.

---

# DTOs

---

## ScreenShareSessionDto

```text
screenShareSessionId

mediaSessionId

participantId

state

captureSource

captureRegion

captureProfile

isActive

createdAt

updatedAt
```

---

## ScreenMetricsDto

```text
frameCaptureLatencyMs

frameDiffRatio

fps

cpuUsage

bandwidthEstimate

droppedFrames
```

---

# Validation Rules

---

Create Session

- MediaSession MUST be ACTIVE
- Participant MUST exist

---

Start Capture

- Session MUST be INITIALIZING or PAUSED

---

Source Switch

- Must be valid capture source
- Region MUST be valid if provided

---

Region Update

- Must be within screen bounds
- Cannot exceed resolution limits

---

Settings Update

- FPS MUST not exceed device capability
- Resolution MUST be supported

---

Stop Session

- Always allowed if session exists

---

# Error Codes

SCREEN_SESSION_NOT_FOUND

MEDIA_SESSION_NOT_ACTIVE

INVALID_CAPTURE_SOURCE

INVALID_REGION

UNSUPPORTED_FPS

DEVICE_NOT_AVAILABLE

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

Screen Share API SHALL NOT expose:

- OS framebuffer
- System UI layers
- Protected regions
- Hardware capture internals

Only abstract metrics and control states.

---

# Audit

Audit events SHALL be generated for:

- Session lifecycle changes
- Source switching
- Region updates
- Settings changes
- Metrics access (optional)

---

# Performance Targets

Start capture:

< 2 seconds

Source switch:

< 500 ms

Region update:

< 300 ms

Metrics fetch:

< 200 ms

---

# Completion Criteria

✓ API implemented

✓ Capture control working

✓ Source switching stable

✓ Region updates safe

✓ Metrics available

✓ Security enforced

---

End of Document