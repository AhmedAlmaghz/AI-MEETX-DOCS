# feature-meeting/participants/REQUIREMENTS.md

Document ID: PARTICIPANTS-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Participants Management

Subdomain: feature-meeting/participants

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The Participants subdomain manages all aspects of participant membership within a meeting.

This includes joining, leaving, roles, permissions, real-time presence tracking, and participant state.

It integrates with the Meeting Lifecycle subdomain (for meeting state gating) and the Translation feature (for language preferences).

---

# 2. Business Requirements

## 2.1 Core Requirements

| ID | Requirement |
|----|-------------|
| PA-BR-001 | Only authenticated users may join a meeting. |
| PA-BR-002 | A meeting may have a maximum number of participants defined by the meeting plan. |
| PA-BR-003 | The host (creator of the meeting) MUST always be a participant with the HOST role. |
| PA-BR-004 | Participants may only join meetings that are in ACTIVE or WAITING state. |
| PA-BR-005 | A participant who leaves may rejoin if the meeting is still ACTIVE. |
| PA-BR-006 | The host may remove any participant from the meeting. |
| PA-BR-007 | Participants must be notified in real-time when others join or leave. |

## 2.2 Role Requirements

| ID | Requirement |
|----|-------------|
| PA-BR-010 | Each participant has exactly one role: HOST, CO_HOST, MODERATOR, SPEAKER, or ATTENDEE. |
| PA-BR-011 | The HOST may promote any participant to CO_HOST or MODERATOR. |
| PA-BR-012 | Moderators may mute participants and remove participants. |
| PA-BR-013 | Only SPEAKER and HOST roles may share audio/video by default. |
| PA-BR-014 | ATTENDEE role may not unmute without explicit host permission. |

---

# 3. Functional Requirements

## 3.1 Join Meeting

| ID | Requirement |
|----|-------------|
| PA-FR-001 | A participant MUST provide a valid meeting ID or invite link to join. |
| PA-FR-002 | The system MUST validate the meeting state before admitting the participant. |
| PA-FR-003 | If a waiting room is enabled, participants MUST wait for host approval. |
| PA-FR-004 | On successful join, the system MUST publish `ParticipantJoinedEvent`. |
| PA-FR-005 | The system MUST assign a LiveKit token to the participant on join. |
| PA-FR-006 | Duplicate join attempts (same user) MUST be detected and rejected or reconnected. |

## 3.2 Leave Meeting

| ID | Requirement |
|----|-------------|
| PA-FR-010 | A participant MUST be able to leave voluntarily at any time. |
| PA-FR-011 | If the host leaves without a co-host, the meeting MUST be ended or host transferred. |
| PA-FR-012 | On leave, the system MUST publish `ParticipantLeftEvent`. |
| PA-FR-013 | Participant's audio/video tracks MUST be removed from the room on leave. |

## 3.3 Remove Participant (Host/Moderator action)

| ID | Requirement |
|----|-------------|
| PA-FR-020 | The host or moderator MUST be able to remove any other participant. |
| PA-FR-021 | Removed participants MUST NOT be able to rejoin the same meeting. |
| PA-FR-022 | The system MUST publish `ParticipantRemovedEvent` with the reason. |
| PA-FR-023 | The removed participant MUST be notified with a reason code. |

## 3.4 Role Management

| ID | Requirement |
|----|-------------|
| PA-FR-030 | The host MUST be able to promote or demote participants. |
| PA-FR-031 | Role changes MUST take immediate effect on permissions. |
| PA-FR-032 | The system MUST publish `ParticipantRoleChangedEvent` on any role change. |

## 3.5 Mute/Unmute Control

| ID | Requirement |
|----|-------------|
| PA-FR-040 | Any participant MAY mute/unmute themselves. |
| PA-FR-041 | The host or moderator MAY mute any other participant. |
| PA-FR-042 | No participant (except themselves) may unmute another — only the participant themselves can unmute after being muted by host. |
| PA-FR-043 | The system MUST publish `ParticipantMutedEvent` and `ParticipantUnmutedEvent`. |

---

# 4. Non-Functional Requirements

| ID | Metric | Target |
|----|--------|--------|
| PA-NFR-001 | Participant join latency | < 2 seconds p95 |
| PA-NFR-002 | Real-time participant list update | < 500ms p95 |
| PA-NFR-003 | Maximum participants per meeting | 500 (Enterprise plan) |
| PA-NFR-004 | Event delivery for join/leave | < 300ms p95 |

---

# 5. Roles & Permissions Matrix

| Permission | HOST | CO_HOST | MODERATOR | SPEAKER | ATTENDEE |
|------------|------|---------|-----------|---------|----------|
| Share Audio | ✅ | ✅ | ✅ | ✅ | ❌ |
| Share Video | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mute Others | ✅ | ✅ | ✅ | ❌ | ❌ |
| Remove Others | ✅ | ✅ | ✅ | ❌ | ❌ |
| End Meeting | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change Roles | ✅ | ✅ | ❌ | ❌ | ❌ |
| Start Recording | ✅ | ✅ | ❌ | ❌ | ❌ |
| Start Translation | ✅ | ✅ | ✅ | ✅ | ✅ |

---

# 6. Dependencies

| Dependency | Type |
|------------|------|
| feature-meeting/lifecycle | MeetingStartedEvent, MeetingEndedEvent |
| feature-auth | Participant identity verification |
| LiveKit | Audio/video track management per participant |
| Event Bus | Publishing and consuming participant events |
| Waiting Room | Optional — gating on host approval |

---

# 7. Glossary

| Term | Definition |
|------|------------|
| Host | The participant who created the meeting and has full control |
| Co-Host | A promoted participant with nearly all host permissions |
| Moderator | A participant who can manage other participants |
| Speaker | A participant who can share audio/video |
| Attendee | A participant who can only listen/watch |
| Waiting Room | A holding area before a participant is admitted |

---

End of Document
