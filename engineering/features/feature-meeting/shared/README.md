# Meeting Shared Kernel Subdomain

## Overview

The `shared` subdomain is the **Shared Kernel** for the entire `feature-meeting` bounded context. It contains all reusable domain primitives, enumerations, common exceptions, and API conventions that are shared across all other meeting subdomains.

> **Rule**: All other meeting subdomains MUST import types from `shared`. They MUST NOT duplicate value objects or domain exceptions locally.

## Documentation Index

1. [Requirements](REQUIREMENTS.md) - Rules governing the shared kernel and its consumers.
2. [Specification](SPECIFICATION.md) - Complete list of value objects, enumerations, and domain exceptions.
3. [Database Schema](DATABASE.md) - The `meetings` master table and entity relationship overview.
4. [API Conventions](API.md) - Standard response shapes, error codes, and HTTP conventions.
5. [Event Catalog](EVENTS.md) - Complete cross-subdomain domain event catalog.
6. [Test Plan](TESTS.md) - 100%-coverage unit tests for all shared domain types.

## Key Contents

- **Value Objects**: `MeetingId`, `ParticipantId`, `UserId`, `RoomName`, `DisplayName`
- **Enumerations**: `ParticipantRole`, `ParticipantStatus`, `MeetingStatus`
- **Domain Exceptions**: `MeetingDomainException` hierarchy (17 typed exceptions)
- **API Conventions**: Standard success/error response schemas, HTTP status codes
- **Event Catalog**: Complete index of all 26 domain events across all meeting subdomains
