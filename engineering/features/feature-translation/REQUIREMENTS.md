# feature-translation/REQUIREMENTS.md

Document ID: TRANSLATION-REQ-001

Version: 2.0.0

Status: Approved

Feature: Real-Time Translation

Priority: P0

Owner: AI & Localization Team

Phase: 11

---

# Revision History

| Version | Change                                              |
|---------|-----------------------------------------------------|
| 1.0.0   | Initial draft using STT + Translation + TTS pipeline |
| 2.0.0   | **Breaking change:** Full migration to Gemini Live Translate Speech-to-Speech |

---

# 1. Overview

AI MEETX provides live real-time translation for all meeting participants.

Participants may select any supported target language at any time during a meeting. All spoken audio is translated to their selected language in near-real-time with simultaneous subtitle delivery.

This is a Phase 11 feature implemented using **Gemini Live Translate** API (`gemini-3.5-live-translate-preview`).

---

# 2. Business Requirements

## 2.1 Core Requirements

| ID | Requirement |
|----|-------------|
| TR-BR-001 | Any participant in a meeting MUST be able to select a target language from any supported language. |
| TR-BR-002 | The system MUST deliver translated audio to the participant within 800ms p95 latency. |
| TR-BR-003 | The system MUST display text subtitles with the translated content. |
| TR-BR-004 | The system MUST create one translation session per target language (not per participant). |
| TR-BR-005 | The system MUST support a minimum of 10 concurrent target languages per meeting. |
| TR-BR-006 | Participants MUST be able to change their target language during the meeting. |
| TR-BR-007 | Original audio MUST be delivered unchanged to participants who do not select a target language. |

## 2.2 Privacy Requirements

| ID | Requirement |
|----|-------------|
| TR-PR-001 | Original audio MUST NOT be stored unless the host has enabled recording AND the participant has consented. |
| TR-PR-002 | Translated audio MUST NOT be stored under any default configuration. |
| TR-PR-003 | All Gemini translation sessions MUST be destroyed within 5 minutes of `MeetingEndedEvent`. |
| TR-PR-004 | Transcripts are treated as user data and must not be shared with any third party. |

---

# 3. Functional Requirements

## 3.1 Language Selection

| ID | Requirement |
|----|-------------|
| TR-FR-001 | Participants MUST be able to browse a searchable list of supported languages. |
| TR-FR-002 | Language selection MUST take effect within 2 seconds. |
| TR-FR-003 | Participants MUST be able to deselect translation and revert to original audio. |
| TR-FR-004 | Language preference MUST be remembered for subsequent meetings. |

## 3.2 Translation Session Management

| ID | Requirement |
|----|-------------|
| TR-FR-010 | The system MUST create a new Gemini session if no session exists for a requested target language. |
| TR-FR-011 | The system MUST route new participants to an existing session if one exists for their language. |
| TR-FR-012 | Sessions MUST be terminated when no participants are using that target language. |
| TR-FR-013 | Sessions MUST reconnect automatically on disconnect (max 3 retries with exponential backoff). |

## 3.3 Audio Delivery

| ID | Requirement |
|----|-------------|
| TR-FR-020 | Translated audio MUST be delivered via a separate LiveKit audio track per language. |
| TR-FR-021 | The original audio track MUST continue to be available for participants not using translation. |
| TR-FR-022 | Translated audio MUST maintain speaker identity awareness where supported by the model. |

## 3.4 Subtitle Delivery

| ID | Requirement |
|----|-------------|
| TR-FR-030 | Text transcripts (original and translated) MUST be available via real-time events. |
| TR-FR-031 | Subtitles MUST be displayed with a 1200ms p95 maximum latency from speech. |
| TR-FR-032 | Subtitles MUST include speaker attribution when available. |

---

# 4. Non-Functional Requirements

## 4.1 Performance

| ID | Metric | Target |
|----|--------|--------|
| TR-NFR-001 | Translated audio latency | < 800ms p95 |
| TR-NFR-002 | Subtitle delivery latency | < 1200ms p95 |
| TR-NFR-003 | Session start time | < 2 seconds |
| TR-NFR-004 | Session reconnect time | < 5 seconds |

## 4.2 Scalability

| ID | Metric | Target |
|----|--------|--------|
| TR-NFR-010 | Concurrent language sessions per meeting | 10 languages |
| TR-NFR-011 | Concurrent meetings with translation | 1000+ |

## 4.3 Reliability

| ID | Requirement |
|----|-------------|
| TR-NFR-020 | Session disconnection MUST trigger automatic reconnection. |
| TR-NFR-021 | If all retries fail, participants MUST be notified and fall back to original audio. |
| TR-NFR-022 | System availability for translation feature: 99.5%. |

---

# 5. Technology Constraints

| Constraint | Value |
|------------|-------|
| Translation Engine | Gemini Live Translate API only |
| Model ID | `gemini-3.5-live-translate-preview` |
| Audio input format | PCM 16kHz, 16-bit, mono |
| Connection protocol | WebSocket over TLS |
| Audio transport | LiveKit SDK |
| Session architecture | One session per target language per meeting |

---

# 6. Supported Languages

Phase 11 launch will support:

| Region | Languages |
|--------|-----------|
| Middle East | Arabic (ar), Persian (fa), Turkish (tr) |
| Europe | English (en), French (fr), German (de), Spanish (es), Italian (it), Portuguese (pt) |
| Asia | Chinese Simplified (zh), Japanese (ja), Korean (ko), Hindi (hi) |
| Africa | Swahili (sw) |

> Note: Supported languages are determined by the Gemini Live Translate model capabilities and may expand in future releases.

---

# 7. Out of Scope (Phase 11)

| Excluded Feature | Reason |
|-----------------|--------|
| Manual STT / Whisper integration | Replaced by Gemini Live Translate |
| Text-only translation | Feature not needed when audio is already translated |
| Translation memory / history | Privacy constraints |
| Custom translation glossaries | Phase 12+ |
| Post-meeting translation of recordings | Phase 12+ |

---

# 8. Dependencies

| Dependency | Type |
|------------|------|
| feature-meeting/lifecycle | MeetingStartedEvent, MeetingEndedEvent |
| feature-meeting/participants | ParticipantJoinedEvent, ParticipantLeftEvent |
| Gemini Live API | External API (Google Cloud) |
| LiveKit | Audio track management |
| feature-auth | Participant identity |

---

# 9. Constraints & Assumptions

| ID | Constraint |
|----|------------|
| TR-CON-001 | The Gemini Live Translate API must be available and accessible. |
| TR-CON-002 | Participants must have a stable network connection to receive translated audio. |
| TR-CON-003 | Audio format must be PCM 16kHz 16-bit mono before sending to Gemini. |
| TR-CON-004 | The model supports bi-directional translation (does not need separate sessions per direction). |

---

# 10. Glossary

| Term | Definition |
|------|------------|
| Translation Session | A WebSocket connection to `gemini-3.5-live-translate-preview` for one language pair |
| Translation Gateway | The service orchestrating all sessions for a meeting |
| LiveKit Audio Track | A WebRTC media track used to deliver audio to participants |
| Original Transcript | Text output of the speaker's original speech |
| Translated Transcript | Text output of the translated speech |
| Translation Router | Component that maps participant language preferences to sessions |

---

End of Document