# feature-meeting/shared/REQUIREMENTS.md

Document ID: SHARED-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Shared Kernel & Cross-Cutting Concerns

Subdomain: feature-meeting/shared

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The `shared` subdomain is the Shared Kernel for the entire `feature-meeting` bounded context.

It provides the cross-cutting value objects, common domain types, shared DTOs, reusable domain exceptions, and utility extensions that are used across all other meeting subdomains (lifecycle, participants, room, permissions, invitations, waiting-room, scheduling, presence).

---

# 2. Business Requirements

| ID | Requirement |
|----|-------------|
| SH-BR-001 | All `feature-meeting` subdomains MUST import shared types only from this module and MUST NOT duplicate value objects. |
| SH-BR-002 | Breaking changes to shared types MUST be accompanied by an ADR and version bump. |
| SH-BR-003 | The shared module MUST NOT have dependencies on any other feature module. |

---

# 3. Functional Requirements

## 3.1 Shared Value Objects

The following domain types are defined once here and reused across all subdomains:

| Type | Used By |
|------|---------|
| `MeetingId` | All subdomains |
| `ParticipantId` | All subdomains |
| `UserId` | All subdomains |
| `DisplayName` | participants, presence, waiting-room |
| `ParticipantRole` | participants, permissions, invitations |
| `ParticipantStatus` | participants, presence |
| `MeetingStatus` | lifecycle, scheduling |
| `RoomName` | room, presence |

## 3.2 Shared Domain Exceptions

Standard exceptions are defined once and reused:

| Exception | Thrown By |
|-----------|-----------|
| `MeetingNotFoundException` | All subdomains |
| `ParticipantNotFoundException` | participants, permissions, presence |
| `InsufficientRoleException` | permissions, room, waiting-room |
| `MeetingAlreadyEndedException` | lifecycle |
| `InvitationExpiredException` | invitations |
| `PermissionDeniedException` | permissions |

---

# 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| SH-NFR-001 | Shared module classes MUST be fully unit-tested with 100% coverage. |
| SH-NFR-002 | Value objects MUST be implemented as Kotlin `@JvmInline value class` for maximum JVM performance. |
| SH-NFR-003 | All exceptions MUST extend a common `MeetingDomainException` base class. |

---

End of Document
