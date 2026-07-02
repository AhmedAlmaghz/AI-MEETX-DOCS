# feature-meeting/permissions/REQUIREMENTS.md

Document ID: PERMISSIONS-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Permissions & Role-Based Access Control

Subdomain: feature-meeting/permissions

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The Permissions subdomain governs the authorization rules, role management, and dynamic permissions during a live meeting session.

It provides a fine-grained, policy-driven model that extends the static participant roles (HOST, CO_HOST, MODERATOR, SPEAKER, ATTENDEE) into dynamic permission flags that can be toggled in real-time by the host or moderators.

---

# 2. Business Requirements

## 2.1 Fine-Granular Permissions

| ID | Requirement |
|----|-------------|
| PM-BR-001 | The system MUST support dynamic permission checks for every action: publishing audio, publishing video, sharing screen, sending chat, starting recording, raising hand, and muting others. |
| PM-BR-002 | The HOST and CO_HOST MUST have unrestricted permissions. |
| PM-BR-003 | MODERATORS MUST be able to manage participant media states (mute audio, stop video, stop screen share) and manage waiting rooms. |
| PM-BR-004 | The HOST MUST be able to customize default permissions for the ATTENDEE role at any time. |
| PM-BR-005 | Changes in meeting permissions MUST be propagated to active participants and applied to their WebRTC tracks within 500ms. |

## 2.2 Dynamic Lobby & Admission Rules

| ID | Requirement |
|----|-------------|
| PM-BR-010 | The host MUST be able to configure who can bypass the waiting room (Everyone, Authenticated Users Only, Invited Guests Only). |
| PM-BR-011 | The host MUST be able to configure who can admit waiting participants (HOST/CO_HOST only, or MODERATORS as well). |

---

# 3. Functional Requirements

## 3.1 Permission Matrices & Defaults

The default mapping of roles to permission flags:

| Permission Flag | HOST | CO_HOST | MODERATOR | SPEAKER | ATTENDEE (Default) |
|-----------------|------|---------|-----------|---------|---------------------|
| `can_publish_audio` | ✅ | ✅ | ✅ | ✅ | ❌ (Muted by default) |
| `can_publish_video` | ✅ | ✅ | ✅ | ✅ | ❌ (Off by default) |
| `can_share_screen` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `can_send_chat` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `can_mute_others` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `can_admit_others` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `can_kick_others` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `can_manage_roles` | ✅ | ✅ | ❌ | ❌ | ❌ |

## 3.2 Dynamic Attendee Lockout (Global Controls)

| ID | Requirement |
|----|-------------|
| PM-FR-001 | The host/co-host MUST be able to toggle `lock_attendee_audio`. When enabled, no attendee can unmute themselves. |
| PM-FR-002 | The host/co-host MUST be able to toggle `lock_attendee_video`. When enabled, no attendee can start their camera. |
| PM-FR-003 | The host/co-host MUST be able to toggle `lock_attendee_chat`. When enabled, attendees cannot post chat messages. |
| PM-FR-004 | These locks MUST NOT affect HOST, CO_HOST, MODERATOR, or SPEAKER roles. |

## 3.3 Request to Speak (Hand Raise)

| ID | Requirement |
|----|-------------|
| PM-FR-010 | ATTENDEEs MUST be able to "Raise Hand" to request permission to speak or share media. |
| PM-FR-011 | Raising hand MUST notify the HOST, CO_HOST, and MODERATORS via real-time events. |
| PM-FR-012 | A moderator or host MUST be able to "Lower Hand" or "Grant Speak Permission". |
| PM-FR-013 | Granting speak permission temporarily overrides the attendee's `can_publish_audio` (and optionally `can_publish_video`) to `true`. |
| PM-FR-014 | The host or moderator MUST be able to "Revoke Speak Permission", reverting the attendee's permissions. |

---

# 4. Non-Functional Requirements

## 4.1 Latency

| ID | Metric | Target |
|----|--------|--------|
| PM-NFR-001 | Permission change propagation latency | < 300ms p95 |
| PM-NFR-002 | Media track enforcement | < 500ms p95 |

## 4.2 Security & Isolation

| ID | Requirement |
|----|-------------|
| PM-NFR-010 | Permission checks MUST be enforced at the server API and WebRTC/LiveKit levels, not just client UI. |
| PM-NFR-011 | LiveKit tokens issued to participants MUST be scoped exactly to their role and current permissions. |

---

# 5. Dependencies

- `feature-meeting/lifecycle` -> To verify meeting is active.
- `feature-meeting/participants` -> To fetch roles and status.
- `feature-meeting/room` -> For WebRTC track enforcement.

---

End of Document
