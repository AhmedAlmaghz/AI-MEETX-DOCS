# engineering/features/feature-media/devices/API.md

Document ID: MEDIA-DEVICES-API-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Devices

---

# Purpose

Defines the external API contracts for managing media devices.

This API controls device discovery, selection, permissions, and switching.

Actual hardware access is handled by the client platform layer.

---

# Base Path

/api/v1/media/devices

Authorization

Bearer Token Required

---

# Resource

MediaDevice

Primary Identifier

deviceId (UUID)

---

# Endpoints

---

## Discover Devices

GET /

Returns all available devices for the participant.

### Response

200 OK

```text
DeviceListDto
```

---

## Request Permissions

POST /permissions

Request system permissions for media access.

### Request

```json
{
  "requestCamera": true,
  "requestMicrophone": true,
  "requestScreenCapture": false
}
```

### Response

200 OK

```text
PermissionStatusDto
```

---

## Select Device

POST /select

Selects an active device.

### Request

```json
{
  "deviceId": "...",
  "type": "CAMERA"
}
```

### Response

200 OK

```text
MediaDeviceDto
```

---

## Switch Device

POST /switch

Switch active device during runtime.

### Request

```json
{
  "fromDeviceId": "...",
  "toDeviceId": "...",
  "type": "MICROPHONE"
}
```

### Response

200 OK

---

## Get Active Devices

GET /active

Returns currently active devices per type.

### Response

200 OK

```text
ActiveDevicesDto
```

---

## Disable Device

POST /{deviceId}/disable

Marks device as unavailable.

---

## Enable Device

POST /{deviceId}/enable

Re-enables a previously unavailable device.

---

## Get Device

GET /{deviceId}

Returns single device.

---

# DTOs

---

## MediaDeviceDto

```text
deviceId

participantId

meetingId

type

label

state

isSelected

isAvailable

lastUpdatedAt
```

---

## DeviceListDto

```text
devices: List<MediaDeviceDto>
```

---

## ActiveDevicesDto

```text
cameraDeviceId

microphoneDeviceId

speakerDeviceId

screenDeviceId
```

---

## PermissionStatusDto

```text
cameraGranted

microphoneGranted

screenGranted

overallStatus
```

---

# Validation Rules

---

Device Selection

- Device MUST exist
- Device MUST be available
- Device MUST match type

---

Permission Request

- Cannot request unsupported permissions

---

Switch Device

- Old and new devices MUST be same type
- Must not break active Media Session

---

# Error Codes

DEVICE_NOT_FOUND

DEVICE_UNAVAILABLE

DEVICE_TYPE_MISMATCH

PERMISSION_DENIED

INVALID_SWITCH

UNAUTHORIZED

SESSION_NOT_ACTIVE

SERVER_ERROR

---

# Retry Policy

GET

Auto retry allowed

POST

No auto retry unless idempotent

---

# Security

Device API SHALL NOT expose:

- OS hardware identifiers
- Internal system paths
- Browser fingerprint data

Only logical device abstraction is exposed.

---

# Audit

The following operations SHALL generate audit events:

- Permission Request
- Device Selection
- Device Switch
- Device Disable/Enable

---

# Performance Targets

Device discovery

< 1 second

Switch device

< 500 ms

Permission response

< 2 seconds

---

# Completion Criteria

✓ API implemented

✓ DTO contracts defined

✓ Validation enforced

✓ Security verified

✓ Tests passing

---

End of Document