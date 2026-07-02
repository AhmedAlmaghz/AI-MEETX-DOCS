# engineering/features/feature-media/devices/EVENTS.md

Document ID: MEDIA-DEVICES-EVT-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Devices

---

# Purpose

Defines all domain events produced and consumed by the Devices subdomain.

Devices acts as the source of truth for hardware state changes inside the Media domain.

---

# Event Principles

All events SHALL:

- Be immutable
- Include eventId
- Include aggregateId
- Include meetingId
- Include participantId
- Include timestamp
- Include correlationId
- Include schemaVersion

---

# Aggregate

Aggregate Type

MediaDevice

Aggregate Identifier

deviceId

---

# Produced Events

---

## DeviceDiscoveredEvent

Published when a new device is detected.

Payload

```text
deviceId
participantId
meetingId
type
label
discoveredAt
```

Consumers

- Device Registry
- Media Session
- UI Layer

---

## DeviceSelectedEvent

Published when a device is selected as active.

Payload

```text
deviceId
participantId
type
selectedAt
```

Consumers

- Media Session
- Audio Engine
- Video Engine
- Screen Share Engine

---

## DeviceSwitchedEvent

Published when switching from one device to another.

Payload

```text
fromDeviceId
toDeviceId
participantId
type
switchedAt
```

Consumers

- Media Session
- Audio Engine
- Video Engine
- Statistics Engine

---

## DeviceUnavailableEvent

Published when a device becomes unavailable.

Payload

```text
deviceId
participantId
reason
timestamp
```

Consumers

- Media Session
- Fallback Manager
- UI Layer

---

## DeviceAvailableEvent

Published when a previously unavailable device is restored.

Payload

```text
deviceId
participantId
restoredAt
```

Consumers

- Media Session
- UI Layer

---

## DevicePermissionGrantedEvent

Published when permissions are granted.

Payload

```text
participantId
permissions
grantedAt
```

Consumers

- Device Manager
- Media Session

---

## DevicePermissionDeniedEvent

Published when permission is denied.

Payload

```text
participantId
permissionType
deniedAt
reason
```

Consumers

- UI Layer
- Fallback System

---

# Consumed Events

---

## MediaSessionActivatedEvent

Action

Enable device selection flow.

---

## MediaSessionClosedEvent

Action

Disable all active devices.

---

## ParticipantJoinedEvent

Action

Trigger device discovery.

---

## ParticipantLeftEvent

Action

Release all device bindings.

---

## SystemPermissionChangedEvent

Action

Sync device availability.

---

# Event Ordering

ParticipantJoinedEvent

↓

DeviceDiscoveredEvent

↓

DevicePermissionGrantedEvent

↓

DeviceSelectedEvent

↓

DeviceSwitchedEvent*

↓

DeviceUnavailableEvent*

↓

MediaSessionClosedEvent

(*) Optional

---

# Delivery Guarantees

At Least Once Delivery

All consumers MUST be idempotent.

Duplicate events MUST NOT cause duplicate device state.

---

# Metadata

All events MUST include:

```text
eventId

aggregateId

meetingId

participantId

aggregateVersion

timestamp

correlationId

producer

schemaVersion
```

---

# Failure Policy

If event publishing fails:

Persist event locally

↓

Retry asynchronously

↓

Log failure

Device state MUST remain consistent.

---

# Security Rules

Events SHALL NOT expose:

- Hardware serial numbers
- OS device identifiers
- Browser fingerprinting data
- Internal system paths

Only logical device abstraction is allowed.

---

# Observability

Metrics:

device_discovered_total

device_selected_total

device_switched_total

device_unavailable_total

device_permission_denied_total

device_permission_granted_total

---

# Completion Criteria

✓ Events implemented

✓ Event bus integrated

✓ Metadata verified

✓ Security validated

✓ Metrics integrated

---

End of Document