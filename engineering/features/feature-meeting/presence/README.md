# Meeting Presence & Active Speaker Subdomain

## Overview

The `presence` subdomain provides real-time participant connectivity monitoring, network quality tracking, and active speaker detection for live meetings.

All presence state is stored in **Redis** (ephemeral, TTL-based), not in PostgreSQL. Only aggregated analytics metrics are persisted to Postgres after the meeting ends.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business, functional, and non-functional requirements for presence tracking.
2. [Specification](SPECIFICATION.md) - Domain model aggregates, value objects, Redis storage strategy, and domain services.
3. [Database Schema](DATABASE.md) - Redis key schemas and post-meeting analytics table.
4. [API Contract](API.md) - REST API endpoints and WebSocket event catalog.
5. [Domain Events](EVENTS.md) - Integration events published and consumed.
6. [Test Plan](TESTS.md) - Test strategy including Unit, Integration, and E2E tests.

## Key Features

- **Real-Time Heartbeat System**: Clients send 5-second heartbeats; server marks participants as DISCONNECTED after 15 seconds of silence.
- **Active Speaker Detection**: Audio level analysis surfaces the dominant speaker dynamically to drive UI spotlight behavior.
- **Network Quality Reporting**: Participants report WebRTC stats (latency, packet loss) to update quality indicators.
- **Redis-First Storage**: All data is hot, ephemeral, and stored exclusively in Redis with auto-expiry TTLs.
- **Presence Broadcasting**: All state changes are broadcast immediately to all meeting participants via WebSocket events.
