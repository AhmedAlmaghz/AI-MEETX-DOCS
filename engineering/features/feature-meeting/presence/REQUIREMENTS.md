# feature-meeting/presence/REQUIREMENTS.md

Document ID: PRESENCE-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Presence Tracking & Active Speakers

Subdomain: feature-meeting/presence

Priority: P0

Owner: Core Meeting Team

Phase: 3

---

# 1. Overview

The Presence subdomain manages the real-time connectivity status, network quality, and speaking status of participants within an active meeting.

It tracks online/offline states, network disconnections/reconnections, and active speakers to dynamically update the meeting UI.

---

# 2. Business Requirements

## 2.1 Connectivity Presence

| ID | Requirement |
|----|-------------|
| PR-BR-001 | The system MUST track participant connectivity state in real-time (CONNECTED, RECONNECTING, DISCONNECTED). |
| PR-BR-002 | If a participant loses network connection, the system MUST wait 15 seconds (grace period) for recovery before marking them offline. |
| PR-BR-003 | The system MUST broadcast presence updates (joins, leaves, connection status changes) to all other participants within 300ms. |

## 2.2 Active Speaker Detection

| ID | Requirement |
|----|-------------|
| PR-BR-010 | The system MUST detect which participant(s) are currently speaking based on audio input levels. |
| PR-BR-011 | Active speaker indicators MUST update in the user interface with a latency of less than 200ms. |

---

# 3. Functional Requirements

## 3.1 Heartbeat & Status Checks

| ID | Requirement |
|----|-------------|
| PR-FR-001 | Clients MUST send a periodic heartbeat signal (every 5 seconds) to the server while in the meeting. |
| PR-FR-002 | If the server misses 3 consecutive heartbeats (15 seconds), it MUST change the participant status to DISCONNECTED. |
| PR-FR-003 | If the participant reconnects, their status MUST revert to CONNECTED, and their WebSocket session must be restored. |
| PR-FR-004 | On status change, the system MUST publish `ParticipantPresenceChangedEvent`. |

## 3.2 LiveKit Audio Volume Analysis

| ID | Requirement |
|----|-------------|
| PR-FR-010 | The client and server LiveKit gateways MUST analyze audio track volume thresholds. |
| PR-FR-011 | The participant with the highest non-zero volume above the threshold (-50dB) is flagged as the `ActiveSpeaker`. |
| PR-FR-012 | The system MUST publish `ActiveSpeakerChangedEvent` when the talking participant shifts. |

---

# 4. Non-Functional Requirements

## 4.1 Latency

| ID | Metric | Target |
|----|--------|--------|
| PR-NFR-001 | Active speaker switch detection latency | < 150ms |
| PR-NFR-002 | Presence state change notification delivery | < 300ms p95 |

## 4.2 Scalability

| ID | Requirement |
|----|-------------|
| PR-NFR-010 | The presence system must handle up to 500 active heartbeats and speaker updates per room with minimal CPU usage (using in-memory caches like Redis). |

---

# 5. Dependencies

- `feature-meeting/lifecycle` -> To verify meeting is active.
- `feature-meeting/participants` -> To map presence to participant aggregates.
- `feature-meeting/room` -> For WebRTC track quality hooks and speaker audio data.

---

End of Document
