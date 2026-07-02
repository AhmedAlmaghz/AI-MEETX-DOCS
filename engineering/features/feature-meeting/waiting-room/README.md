# Meeting Waiting Room & Lobby Subdomain

## Overview

The `waiting-room` subdomain manages the queue and holding lobby of participants waiting for host approval before gaining access to a meeting.

It gates joining attempts, manages host review controls (admit/deny), and handles the WebSocket signaling channels required to update waiting participants and hosts in real-time.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business, functional, and non-functional requirements for the waiting room lobby.
2. [Specification](SPECIFICATION.md) - Domain model aggregates, value objects, and domain services.
3. [Database Schema](DATABASE.md) - SQL tables, indexes, and queries.
4. [API Contract](API.md) - REST API endpoints and real-time WebSocket events.
5. [Domain Events](EVENTS.md) - Integration events published and consumed.
6. [Test Plan](TESTS.md) - Test strategy including Unit, Integration, and E2E tests.

## Key Features

- **Guest Knock Queue**: Holds join requesters in a separate state from active participants.
- **Host Queue Controls**: Real-time listing, admitting, and rejections of waiting participants (individually or in bulk).
- **Lobby Device Checks**: Allows waiting guests to test audio/video configurations locally before entering the meeting.
- **Broadcast Announcements**: Allows hosts/moderators to broadcast updates to the waiting lobby.
- **WebRTC Isolation**: Guarantees that waiting participants cannot access media tracks of the main meeting room.
