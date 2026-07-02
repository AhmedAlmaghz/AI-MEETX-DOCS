# Meeting Scheduling & Calendar Subdomain

## Overview

The `scheduling` subdomain handles booking meetings in advance, managing recurring meeting occurrences (with RFC 5545 RRule support), timezone calculations, generating standard `.ics` (iCalendar) files, and managing scheduled reminder offsets.

It works in tandem with `feature-meeting/lifecycle` (to start/transition meetings when their scheduled slots arrive), `feature-meeting/invitations` (to link invitations to schedules), and `feature-notification` (to deliver scheduled reminders).

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Business, functional, and non-functional requirements for meeting scheduling.
2. [Specification](SPECIFICATION.md) - Domain model aggregates, value objects, and domain services.
3. [Database Schema](DATABASE.md) - SQL tables, indexes, and reminder schedules.
4. [API Contract](API.md) - REST API endpoints, iCal exports, and recurrence parameters.
5. [Domain Events](EVENTS.md) - Integration events published and consumed.
6. [Test Plan](TESTS.md) - Test strategy including Unit, Integration, and E2E tests.

## Key Features

- **Single & Recurring Bookings**: Schedule meetings for a single slot or define repeating series (Daily, Weekly, Monthly).
- **Timezone Safety**: Store all times in UTC format, with zone identifiers to protect against local time shifts and Daylight Saving Transitions.
- **RRule Expanse**: Automatically expand recurring rules to generate future occurrences.
- **Calendar sync (ICS)**: Generate standard `.ics` documents and direct calendar integration links.
- **Reminder Triggers**: Schedule multiple notification offsets (e.g. 15 minutes before meeting) for automated alerts.
