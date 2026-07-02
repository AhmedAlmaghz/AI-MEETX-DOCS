# feature-meeting/waiting-room/REQUIREMENTS.md

Document ID: WAITING-ROOM-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Waiting Room / Lobby Management

Subdomain: feature-meeting/waiting-room

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The Waiting Room subdomain provides holding area capabilities for meetings.

When enabled, participants trying to join the meeting are placed in a waiting room lobby until approved (admitted) or rejected (denied) by the host or moderators.

---

# 2. Business Requirements

## 2.1 Lobby & Admission Flow

| ID | Requirement |
|----|-------------|
| WR-BR-001 | If the waiting room is enabled in meeting settings, participants NOT matching bypass criteria MUST be routed to the waiting room. |
| WR-BR-002 | The host and moderators MUST see a real-time list of waiting participants. |
| WR-BR-003 | The host or moderator MUST be able to admit participants individually or in bulk. |
| WR-BR-004 | The host or moderator MUST be able to deny participants entry, optionally providing a reason. |
| WR-BR-005 | Participants in the waiting room MUST NOT hear, see, or chat with active meeting participants. |

## 2.2 In-Lobby Capabilities

| ID | Requirement |
|----|-------------|
| WR-BR-010 | Participants in the waiting room MUST be able to test their audio and video devices locally. |
| WR-BR-011 | The host/moderator MUST be able to send chat announcements to the waiting room. |
| WR-BR-012 | Waiting participants MUST be able to reply to host/moderator announcements in the lobby (if allowed by host settings). |

---

# 3. Functional Requirements

## 3.1 Knock & Join Lobby

| ID | Requirement |
|----|-------------|
| WR-FR-001 | When joining, if waiting room policy gates the user, a `waiting_room_entries` record MUST be created with status `WAITING`. |
| WR-FR-002 | The system MUST publish `WaitingRoomEnteredEvent`. |
| WR-FR-003 | The waiting participant's connection is kept open over a separate restricted WebSocket channel. |

## 3.2 Host Actions

| ID | Requirement |
|----|-------------|
| WR-FR-010 | Admit action: transitions state to `ADMITTED`, updates status in `meeting_participants` to `ACTIVE`, issues LiveKit token, and publishes `WaitingRoomAdmittedEvent`. |
| WR-FR-011 | Deny action: transitions state to `DENIED`, updates status to `REMOVED` or `DENIED`, and publishes `WaitingRoomDeniedEvent`. |
| WR-FR-012 | If denied, the participant's client connection is closed immediately. |

---

# 4. Non-Functional Requirements

## 4.1 Latency

| ID | Metric | Target |
|----|--------|--------|
| WR-NFR-001 | Admission to live WebRTC connection delay | < 1.5 seconds p95 |
| WR-NFR-002 | Notification of knock to host | < 300ms p95 |

## 4.2 Security

| ID | Requirement |
|----|-------------|
| WR-NFR-010 | Under no circumstances may a waiting room participant receive WebRTC track details of the meeting before being admitted. |
| WR-NFR-011 | The waiting room channel must be authenticated and scoped to prevents socket session hijacking. |

---

# 5. Dependencies

- `feature-meeting/lifecycle` -> To verify meeting is active.
- `feature-meeting/participants` -> Gated by waiting room check on join.
- `feature-meeting/permissions` -> Checked for waiting room policy.

---

End of Document
