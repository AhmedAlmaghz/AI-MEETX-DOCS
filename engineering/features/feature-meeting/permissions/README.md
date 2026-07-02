# Meeting Permissions & Access Control Subdomain

## Overview

The `permissions` subdomain is responsible for managing both global meeting-level access restrictions (e.g. locking microphone/camera publishing, locking chat, and configuring waiting room bypass rules) and fine-grained, individual participant permission overrides (e.g. granting custom speaking or screen sharing rights to specific attendees).

It integrates directly with **LiveKit** to enforce media track publishing permissions and dynamically updates participant tokens or track publishing rights as permissions change.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business, functional, and non-functional requirements for permissions.
2. [Specification](SPECIFICATION.md) - Domain model aggregates, value objects, and domain services.
3. [Database Schema](DATABASE.md) - SQL tables, indexes, and queries.
4. [API Contract](API.md) - REST API endpoints and WebSocket payloads.
5. [Domain Events](EVENTS.md) - Integration events published and consumed.
6. [Test Plan](TESTS.md) - Test strategy including Unit, Integration, E2E, and compliance tests.

## Key Features

- **Granular Role-Based Access Control (RBAC)**: Enforces default permissions based on participant roles (Host, Co-Host, Moderator, Speaker, Attendee).
- **Global Attendee Lockdowns**: Lets hosts dynamically disable microphone, camera, or chat capabilities for all attendees in real-time.
- **Granular Permission Overrides**: Allows hosts/moderators to customize individual attendee permission lists.
- **Hand Raise Flow**: Supports attendees requesting to speak via hand raising, with a moderator review queue and temporary speak permission grants.
- **LiveKit Track Integration**: Dynamically propagates permission updates directly to LiveKit track publish capabilities on the fly.
