# feature-recording/REQUIREMENTS.md

Document ID: RECORDING-REQ-001

Version: 1.0.0

Status: Approved

Feature: Meeting Recording

Module: feature-recording

Priority: P1

Owner: Media Platform Team

Phase: 4

---

# 1. Overview

The `feature-recording` module manages the recording of meetings, layout composition, cloud storage, and media exports.

Recordings are composed by LiveKit's Egress service, which renders meeting rooms into video/audio files and saves them to cloud storage.

---

# 2. Business Requirements

| ID | Requirement |
|----|-------------|
| REC-BR-001 | The host MUST be able to start and stop recording at any point during an active meeting. |
| REC-BR-002 | Participants MUST be visibly notified when recording is active (indicator + audio announcement). |
| REC-BR-003 | The host MUST be able to choose recording layout: Speaker View, Gallery View, or Audio-Only. |
| REC-BR-004 | Completed recordings MUST be available for download within 10 minutes of meeting end. |
| REC-BR-005 | Recordings MUST have a configurable retention period (default: 30 days). |

---

# 3. Functional Requirements

## 3.1 Recording Lifecycle

| ID | Requirement |
|----|-------------|
| REC-FR-001 | On `StartRecordingCommand`, the system MUST call the LiveKit Egress API to begin recording. |
| REC-FR-002 | On `StopRecordingCommand`, the system MUST call LiveKit Egress to stop, then wait for the file to be uploaded to cloud storage. |
| REC-FR-003 | The system MUST publish `RecordingStartedEvent` and `RecordingStoppedEvent`. |

## 3.2 Storage & Access

| ID | Requirement |
|----|-------------|
| REC-FR-010 | Recordings MUST be stored in object storage (AWS S3 or GCS). |
| REC-FR-011 | Access to recordings MUST be controlled — only the host and co-host can access by default. |
| REC-FR-012 | The host MUST be able to generate a shareable download link with an expiration time (max 72 hours). |

---

# 4. Non-Functional Requirements

## 4.1 Performance

| ID | Metric | Target |
|----|--------|--------|
| REC-NFR-001 | Recording start delay | < 5 seconds |
| REC-NFR-002 | File availability after meeting end | < 10 minutes |

## 4.2 Storage

| ID | Requirement |
|----|-------------|
| REC-NFR-010 | Recordings MUST be stored in a separate cloud bucket from media tracks. |
| REC-NFR-011 | Recordings MUST be encrypted at rest (AES-256). |

---

# 5. Dependencies

- `feature-meeting/room` -> To get LiveKit room name for Egress API calls.
- `feature-meeting/lifecycle` -> To gate recording to ACTIVE meetings only.
- `feature-notification` -> To notify host when recording is ready.

---

End of Document
