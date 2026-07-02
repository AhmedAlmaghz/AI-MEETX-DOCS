# feature-classroom/REQUIREMENTS.md

Document ID: CLASSROOM-REQ-001

Version: 1.0.0

Status: Approved

Feature: Virtual Classroom

Module: feature-classroom

Priority: P1

Owner: Education Platform Team

Phase: 7

---

# 1. Overview

The `feature-classroom` module extends meetings into a full virtual classroom experience.

It adds education-specific tools: structured attendance tracking, hand-raising queue management, live quizzes and polls, collaborative digital whiteboards, and breakout rooms for group work.

---

# 2. Business Requirements

| ID | Requirement |
|----|-------------|
| CL-BR-001 | A meeting MUST be designatable as a "Classroom" session from the scheduling or lifecycle modules. |
| CL-BR-002 | The instructor (HOST) MUST be able to pause the classroom and resume it (lecture mode). |
| CL-BR-003 | The system MUST track attendance — who joined, when, and for how long. |
| CL-BR-004 | The instructor MUST be able to create quiz/poll questions and receive real-time aggregated responses. |
| CL-BR-005 | The system MUST support at least 1 active whiteboard per classroom session. |
| CL-BR-006 | The instructor MUST be able to create breakout rooms and assign students to them. |

---

# 3. Functional Requirements

## 3.1 Attendance

| ID | Requirement |
|----|-------------|
| CL-FR-001 | The system MUST log entry/exit timestamps for each participant when classroom mode is active. |
| CL-FR-002 | The instructor MUST be able to export an attendance report (CSV format). |

## 3.2 Quiz & Poll

| ID | Requirement |
|----|-------------|
| CL-FR-010 | The instructor MUST be able to create multiple-choice questions (up to 6 options). |
| CL-FR-011 | Results MUST be aggregated and shown in real-time as students vote. |
| CL-FR-012 | The instructor MAY choose to show or hide correct answers. |

## 3.3 Whiteboard

| ID | Requirement |
|----|-------------|
| CL-FR-020 | The whiteboard MUST support freehand drawing, text, shapes, and image insertion. |
| CL-FR-021 | The whiteboard MUST synchronize changes across all participants within 200ms. |
| CL-FR-022 | The instructor MAY choose to allow or restrict student whiteboard editing. |

## 3.4 Breakout Rooms

| ID | Requirement |
|----|-------------|
| CL-FR-030 | The instructor MUST be able to create up to 20 breakout rooms. |
| CL-FR-031 | Students MUST be automatically assigned to breakout rooms or moved manually. |
| CL-FR-032 | The instructor MUST be able to broadcast a message to all breakout rooms simultaneously. |

---

# 4. Non-Functional Requirements

| ID | Metric | Target |
|----|--------|--------|
| CL-NFR-001 | Whiteboard sync latency | < 200ms p95 |
| CL-NFR-002 | Quiz result aggregation | < 1 second after submission |

---

# 5. Dependencies

- `feature-meeting/lifecycle` -> For pause/resume and classroom mode designation.
- `feature-meeting/participants` -> For attendance log.
- `feature-meeting/room` -> For LiveKit room management of breakout rooms.

---

End of Document
