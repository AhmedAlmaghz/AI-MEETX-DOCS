# Notification System Module

## Overview

`feature-notification` is the platform-wide, event-driven notification delivery system. It consumes domain events from all other modules and dispatches alerts to users through Push (FCM/APNs), Email, and SMS channels — while respecting per-user notification preferences and enforcing idempotency to prevent duplicate delivery.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business requirements, channel support, and delivery guarantees.
2. [Specification](SPECIFICATION.md) - Domain models, notification pipeline, channel gateways, and template system.
3. [Database Schema](DATABASE.md) - Notifications log, user preferences, and device token tables.
4. [API Contract](API.md) - REST endpoints for notification history, preferences, and device registration.
5. [Event Catalog](EVENTS.md) - Complete list of consumed events and their notification mappings.
6. [Test Plan](TESTS.md) - Unit tests for idempotency and preference filtering, integration gateway tests.

## Key Features

- **Multi-Channel Delivery**: FCM/APNs push, email (with HTML templates), and SMS via Twilio.
- **Preference Respecting**: Per-user, per-event-type channel preferences enforced before dispatch.
- **Idempotency**: 60-second suppression window prevents duplicate notifications from event replays.
- **Template System**: HTML email templates rendered with Thymeleaf engine, with ICS calendar attachments.
- **Event-Driven**: Zero polling — all notifications triggered by platform domain events.
