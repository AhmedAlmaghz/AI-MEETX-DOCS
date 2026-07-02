# Meeting Invitations & RSVP Subdomain

## Overview

The `invitations` subdomain manages the lifecycle of meeting invitations, attendee RSVP responses, secure link token generation, and passcode-based meeting gating.

It facilitates sending email invitations (in coordination with `feature-notification`), capturing whether an invitee accepts or declines, and validating secure access tokens when invitees click the link to join a meeting.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business, functional, and non-functional requirements for invitations and RSVPs.
2. [Specification](SPECIFICATION.md) - Domain model aggregates, value objects, and domain services.
3. [Database Schema](DATABASE.md) - SQL tables, indexes, and queries.
4. [API Contract](API.md) - REST API endpoints and error definitions.
5. [Domain Events](EVENTS.md) - Integration events published and consumed.
6. [Test Plan](TESTS.md) - Test strategy including Unit, Integration, and E2E tests.

## Key Features

- **Bulk Email Invitations**: Send invitations to lists of invitees with pre-defined roles.
- **RSVP Tracking**: Allow invitees to RSVP accept or decline directly from unique links.
- **Secure Access Gating**: Protect meetings with cryptographically secure random tokens embedded in links.
- **Passcode Protection**: Hash and store meeting passcodes to authenticate attendees on room entry.
- **Calendar Integration**: Attach standard ICS files to invite emails for calendar synchronization.
