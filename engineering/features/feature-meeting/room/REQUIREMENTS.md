# feature-meeting/room/REQUIREMENTS.md

Document ID: ROOM-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Room Management

Subdomain: feature-meeting/room

Priority: P0

Owner: Core Meeting Team

Phase: 4

---

# 1. Overview

The Room subdomain manages the real-time audio/video infrastructure for an active meeting.

It integrates with LiveKit to manage participant media tracks, screen sharing, room settings, and quality control.

The Room subdomain is distinct from the Meeting Lifecycle subdomain:
- Lifecycle manages the meeting state machine (SCHEDULED → ACTIVE → ENDED).
- Room manages the real-time media session WITHIN the ACTIVE state.

---

# 2. Business Requirements

| ID | Requirement |
|----|-------------|
| RM-BR-001 | Every ACTIVE meeting MUST have an associated LiveKit room. |
| RM-BR-002 | The LiveKit room MUST be created when the meeting transitions to ACTIVE state. |
| RM-BR-003 | The LiveKit room MUST be destroyed when the meeting transitions to ENDED state. |
| RM-BR-004 | Participants MUST be able to share their camera, microphone, and screen. |
| RM-BR-005 | The host MUST be able to control room settings (lock, mute all, disable video). |
| RM-BR-006 | Room quality settings MUST be configurable per meeting. |
| RM-BR-007 | The system MUST monitor room health and report connectivity issues. |

---

# 3. Functional Requirements

## 3.1 Room Lifecycle

| ID | Requirement |
|----|-------------|
| RM-FR-001 | On MeetingStartedEvent, a LiveKit room MUST be created with the meeting's configuration. |
| RM-FR-002 | On MeetingEndedEvent, the LiveKit room MUST be destroyed and all tracks released. |
| RM-FR-003 | The room configuration MUST be derived from the meeting plan (max participants, quality). |

## 3.2 Media Controls

| ID | Requirement |
|----|-------------|
| RM-FR-010 | Participants with SPEAKER or HOST role MUST be able to publish audio/video tracks. |
| RM-FR-011 | ATTENDEE participants MUST NOT be able to publish audio/video tracks by default. |
| RM-FR-012 | The host MAY enable "Request to Speak" for attendees. |
| RM-FR-013 | Screen sharing MUST be limited to one participant at a time (default). |
| RM-FR-014 | The host MAY allow multiple screen shares simultaneously. |

## 3.3 Room Settings

| ID | Requirement |
|----|-------------|
| RM-FR-020 | The host MUST be able to lock the room (prevent new joins). |
| RM-FR-021 | The host MUST be able to mute all participants simultaneously. |
| RM-FR-022 | The host MUST be able to disable all video in the room. |
| RM-FR-023 | All room setting changes MUST be applied in real-time (< 500ms). |

## 3.4 Quality & Diagnostics

| ID | Requirement |
|----|-------------|
| RM-FR-030 | The system MUST monitor network quality per participant. |
| RM-FR-031 | Participants with poor connection MUST see a quality warning. |
| RM-FR-032 | The system MUST support adaptive bitrate for video tracks. |

---

# 4. Non-Functional Requirements

| ID | Metric | Target |
|----|--------|--------|
| RM-NFR-001 | Room creation time | < 1 second |
| RM-NFR-002 | Track publish time | < 500ms p95 |
| RM-NFR-003 | Mute all participants | < 500ms p95 |
| RM-NFR-004 | Maximum video tracks per room | 25 simultaneous HD streams |
| RM-NFR-005 | Room destruction time after meeting end | < 30 seconds |

---

# 5. Dependencies

| Dependency | Type |
|------------|------|
| feature-meeting/lifecycle | MeetingStartedEvent, MeetingEndedEvent |
| feature-meeting/participants | ParticipantJoinedEvent, ParticipantLeftEvent, ParticipantRemovedEvent |
| LiveKit | Audio/video infrastructure |
| Event Bus | Publishing room events |

---

End of Document
