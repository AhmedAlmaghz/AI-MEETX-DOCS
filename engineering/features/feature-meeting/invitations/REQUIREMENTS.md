# feature-meeting/invitations/REQUIREMENTS.md

Document ID: INVITATIONS-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Invitations & RSVP

Subdomain: feature-meeting/invitations

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The Invitations subdomain manages the creation, distribution, verification, and RSVP tracking of meeting invitations.

It enables hosts to invite participants via email, generates shareable secure meeting links, tracks invitee status, and gates meeting entry using signature tokens and passcodes.

---

# 2. Business Requirements

## 2.1 Invitation Actions

| ID | Requirement |
|----|-------------|
| IN-BR-001 | A meeting host MUST be able to invite users by email or user ID. |
| IN-BR-002 | The host MUST be able to generate a shareable secure link with an embedded access token. |
| IN-BR-003 | Invited participants MUST be able to accept (RSVP Yes) or decline (RSVP No) invitations. |
| IN-BR-004 | Invitations MUST have expiration times, after which they can no longer be used. |
| IN-BR-005 | The system MUST support sending calendar attachments (.ics files) with invitations. |

## 2.2 Security & Passcodes

| ID | Requirement |
|----|-------------|
| IN-BR-010 | The host MUST be able to set a meeting passcode. |
| IN-BR-011 | Shareable links MAY choose to embed the passcode or require users to enter it manually on join. |
| IN-BR-012 | The system MUST generate a cryptographically secure token for each invitation to prevent links from being guessed. |

---

# 3. Functional Requirements

## 3.1 Invitation Creation & Delivery

| ID | Requirement |
|----|-------------|
| IN-FR-001 | The host MUST be able to send single or bulk email invitations. |
| IN-FR-002 | The system MUST send invitation emails containing: meeting name, host name, scheduled date/time, a direct join link, and a calendar attachment. |
| IN-FR-003 | Invitations MUST support custom roles (e.g. inviting someone explicitly as a SPEAKER or MODERATOR). |
| IN-FR-004 | On invitation creation, the system MUST publish `InvitationCreatedEvent`. |

## 3.2 RSVP Management

| ID | Requirement |
|----|-------------|
| IN-FR-010 | Invitees MUST be able to accept or decline the invite without logging in (via unique token links). |
| IN-FR-011 | The system MUST update the status to ACCEPTED or DECLINED and publish `InvitationRsvpUpdatedEvent`. |
| IN-FR-012 | The host MUST be able to view an RSVP breakdown (Yes, No, Pending) for any meeting. |

## 3.3 Access Gating

| ID | Requirement |
|----|-------------|
| IN-FR-020 | When joining a meeting, the system MUST check if:
  - The meeting has a passcode and a valid passcode is provided.
  - The user has a valid invitation (if the meeting is restricted to invited guests). |
| IN-FR-021 | If the invitation token is invalid or expired, entry MUST be denied. |

---

# 4. Non-Functional Requirements

## 4.1 Latency

| ID | Metric | Target |
|----|--------|--------|
| IN-NFR-001 | Invitation generation time | < 500ms p95 |
| IN-NFR-002 | Access token validation latency | < 200ms p95 |

## 4.2 Security

| ID | Requirement |
|----|-------------|
| IN-NFR-010 | Invitation tokens MUST be generated using cryptographically secure random strings (minimum 32 characters). |
| IN-NFR-011 | Meeting passcodes MUST be stored hashed in the database (e.g., using BCrypt or Argon2id). |

---

# 5. Dependencies

- `feature-meeting/lifecycle` -> To link invitations to meetings.
- `feature-meeting/permissions` -> To apply role assignments specified in the invitation.
- `feature-notification` -> To trigger email delivery.

---

# 6. Glossary

- **RSVP**: Respondez S'il Vous Plait. A response to an invitation.
- **Passcode**: A simple code (numeric or alphanumeric) required to enter a meeting.
- **Invite Link**: A unique, signed URL generated to allow access.

---

End of Document
