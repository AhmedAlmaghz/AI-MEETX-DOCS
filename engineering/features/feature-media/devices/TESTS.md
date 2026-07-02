# engineering/features/feature-media/devices/TESTS.md

Document ID: MEDIA-DEVICES-TEST-001

Version: 1.0.0

Status: Approved

Feature: Media

Subdomain: Devices

---

# Purpose

Defines the verification strategy for the Devices subdomain.

Ensures correctness of device discovery, selection, switching, and permission handling.

---

# Test Pyramid

Unit Tests

↓

Integration Tests

↓

Contract Tests

↓

End-to-End Tests

---

# Device Discovery Tests

Verify:

✓ Camera detection

✓ Microphone detection

✓ Speaker detection

✓ Screen capture detection

✓ No devices fallback scenario

---

# Permission Tests

Verify:

Camera permission granted

Camera permission denied

Microphone permission granted

Microphone permission denied

Screen capture permission granted

Screen capture denied

Graceful degradation on denial

---

# Device Selection Tests

Verify:

Select valid device

Reject invalid device

Reject unavailable device

Single active device per type

State persistence after selection

---

# Device Switching Tests

Verify:

Switch camera during active session

Switch microphone during active session

Switch speaker during active session

Switch screen source during sharing

No session interruption during switch

Fallback when switch fails

---

# Device Availability Tests

Verify:

Device disconnect detection

Device reconnect detection

Device becomes unavailable

Device becomes available again

Automatic fallback selection

---

# State Consistency Tests

Verify:

Device state matches Media Session state

No duplicate active devices

No conflicting selections

Atomic state updates

---

# Integration Tests

Verify integration with:

Media Session

Participant Subsystem

Permission System

Operating System APIs (mocked)

---

# API Contract Tests

Verify endpoints:

GET /devices

POST /devices/permissions

POST /devices/select

POST /devices/switch

POST /devices/{id}/disable

POST /devices/{id}/enable

GET /devices/active

Validate:

DTO structure

Error handling

Authorization

---

# Event Tests

Verify emission of:

DeviceDiscoveredEvent

DeviceSelectedEvent

DeviceSwitchedEvent

DeviceUnavailableEvent

DeviceAvailableEvent

DevicePermissionGrantedEvent

DevicePermissionDeniedEvent

Ensure:

Idempotency

Ordering

CorrelationId propagation

---

# Concurrency Tests

Simultaneous device selection requests

Simultaneous switch requests

Race condition on availability change

Multiple permission requests at once

---

# Recovery Tests

Device disconnected mid-session

Browser refresh during active call

Permission revoked during session

Device reconnect after failure

---

# Security Tests

Verify:

Participant can only manage own devices

No cross-participant device access

No exposure of hardware identifiers

Permission enforcement strict

---

# Performance Tests

Device discovery

< 1 second

Device switch

< 500 ms

Permission response

< 2 seconds

Event propagation

< 300 ms

---

# Coverage Targets

Aggregate

100%

Use Cases

95%

Repository

90%

API

90%

Events

95%

---

# Completion Criteria

✓ Device management verified

✓ Switching validated

✓ Permissions tested

✓ Events validated

✓ Security enforced

✓ Performance achieved

---

End of Document