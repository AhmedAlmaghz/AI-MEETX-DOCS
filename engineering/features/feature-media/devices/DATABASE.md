# engineering/features/feature-media/devices/DATABASE.md

Document ID: MEDIA-DEVICES-DB-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Devices

---

# Purpose

Defines the persistence model for media devices.

Devices are stored as a logical representation of hardware state per participant context.

---

# Aggregate

MediaDevice

↓

DeviceCapabilities

DeviceConstraints

DeviceState

---

# Primary Entity

MediaDevice

| Field | Type | Required |
|--------|------|----------|
| deviceId | UUID | Yes |
| participantId | UUID | Yes |
| meetingId | UUID | Yes |
| type | Enum | Yes |
| label | String | Yes |
| state | Enum | Yes |
| isSelected | Boolean | Yes |
| isAvailable | Boolean | Yes |
| lastUpdatedAt | Instant | Yes |

---

# Value Object

DeviceCapabilities

| Field | Type |
|--------|------|
| audioInput | Boolean |
| audioOutput | Boolean |
| videoInput | Boolean |
| screenCapture | Boolean |
| echoCancellation | Boolean |
| noiseSuppression | Boolean |

---

# Value Object

DeviceConstraints

| Field | Type |
|--------|------|
| maxResolution | String |
| maxFrameRate | Integer |
| minLatencyMs | Integer |
| supportedFormats | List<String> |

---

# Value Object

DeviceState

| Field | Type |
|--------|------|
| status | Enum |
| permissionState | Enum |
| healthStatus | Enum |
| lastError | String? |

---

# Repository Contract

MediaDeviceRepository

Operations

DiscoverDevices

SaveDevice

UpdateDevice

SelectDevice

DeselectDevice

MarkUnavailable

MarkAvailable

FindByParticipant

FindByMeeting

FindActiveDevices

FindByType

---

# Logical Collections

media_devices

---

# Relationships

Participant

1

↓

N

MediaDevice

Meeting

1

↓

N

MediaDevice

MediaSession

1

↓

N (logical usage only)

MediaDevice

---

# Cache Strategy

L1

Memory

Active Devices Per Participant

---

L2

Local Cache

Recent Device State

---

L3

Persistent Storage

Device History

---

# Synchronization Strategy

Device Discovery

↓

Persist Device List

↓

Emit DeviceDiscoveredEvent

↓

Sync with Media Session

---

Device Selection

↓

Update State

↓

Persist

↓

Emit DeviceSelectedEvent

---

Device Failure

↓

Mark Unavailable

↓

Fallback Selection

↓

Emit DeviceUnavailableEvent

---

# Query Patterns

Find Active Camera

Find Active Microphone

Find Active Speaker

Find Available Devices

Find Devices By Type

Find Devices By Participant

---

# Index Recommendations

deviceId

participantId

meetingId

type

state

isSelected

lastUpdatedAt

---

# Consistency Rules

Only one active device per type per participant.

Device state changes SHALL be atomic.

Unavailable devices SHALL NOT be selectable.

---

# Retention Policy

Device state history MAY be retained for analytics.

Old device records MAY be archived.

---

# Security

Device metadata SHALL NOT expose:

- OS device identifiers
- Hardware serial numbers
- System-level paths

---

# Migration Rules

Schema Version

Incremental versioning required for device capability updates.

---

# Completion Criteria

✓ Device persistence implemented

✓ Selection logic supported

✓ Query optimization completed

✓ Sync strategy verified

✓ Tests passing

---

End of Document