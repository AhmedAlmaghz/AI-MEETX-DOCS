# feature-translation/EVENTS.md

Document ID: TRANSLATION-EVENTS-001

Version: 2.0.0

Status: Approved

Feature: Real-Time Translation

Phase: 11

---

# Overview

This document defines all domain events published and consumed by the Translation feature.

Events are delivered via the internal Event Bus. Participants receive real-time updates via WebSocket (LiveKit Data Channel or SignalR).

---

# Events Published

---

## TranslationSessionStartedEvent

Published when a Gemini Live Translate session is successfully established for a meeting language pair.

```yaml
Event: TranslationSessionStartedEvent

Schema:
  sessionId: string            # Unique ID of the translation session
  meetingId: string            # Meeting this session belongs to
  targetLanguage: string       # BCP-47 language code (e.g., "ar", "fr")
  model: string                # "gemini-3.5-live-translate-preview"
  participantCount: integer    # Number of participants routed to this session
  startedAt: ISO8601           # Session creation timestamp

Routing:
  topic: translation.session.started
  partitionKey: meetingId
```

---

## TranslationSessionTerminatedEvent

Published when a Gemini session ends (either by meeting end, or because no participants are using that language).

```yaml
Event: TranslationSessionTerminatedEvent

Schema:
  sessionId: string
  meetingId: string
  targetLanguage: string
  reason: enum [MEETING_ENDED, NO_PARTICIPANTS, ERROR, TIMEOUT, PRIVACY_CLEANUP]
  terminatedAt: ISO8601

Routing:
  topic: translation.session.terminated
  partitionKey: meetingId
```

---

## LiveTranslationDeliveredEvent

Published when a translated audio segment has been successfully delivered to participants.

This event is for logging and analytics — the actual audio is delivered via LiveKit.

```yaml
Event: LiveTranslationDeliveredEvent

Schema:
  sessionId: string
  meetingId: string
  targetLanguage: string
  speakerId: string              # Original speaker participant ID
  audioChunkId: string
  durationMs: integer
  deliveredAt: ISO8601
  latencyMs: integer             # End-to-end audio translation latency

Routing:
  topic: translation.audio.delivered
  partitionKey: sessionId
```

---

## TranscriptSegmentDeliveredEvent

Published when a text transcript segment (original or translated) is available.

Used for real-time subtitle delivery and optional transcript recording.

```yaml
Event: TranscriptSegmentDeliveredEvent

Schema:
  sessionId: string
  meetingId: string
  speakerId: string
  targetLanguage: string
  originalText: string           # Speaker's original words
  translatedText: string         # Translated version
  startMs: integer               # Segment start time within meeting audio
  endMs: integer                 # Segment end time within meeting audio
  isFinal: boolean               # True if this is the finalized transcript (not an interim result)
  deliveredAt: ISO8601

Routing:
  topic: translation.transcript.delivered
  partitionKey: meetingId
```

---

## TranslationErrorEvent

Published when a session encounters a recoverable or unrecoverable error.

```yaml
Event: TranslationErrorEvent

Schema:
  sessionId: string
  meetingId: string
  targetLanguage: string
  errorCode: string              # e.g., "WEBSOCKET_DISCONNECT", "QUOTA_EXCEEDED"
  errorMessage: string
  isRecoverable: boolean
  retryAttempt: integer          # 0 = first error, 1 = first retry, etc.
  occurredAt: ISO8601

Routing:
  topic: translation.error
  partitionKey: sessionId
```

---

## ParticipantLanguageChangedEvent

Published when a participant changes their target language.

```yaml
Event: ParticipantLanguageChangedEvent

Schema:
  meetingId: string
  participantId: string
  previousLanguage: string | null   # null if translation was not previously active
  newLanguage: string
  changedAt: ISO8601

Routing:
  topic: translation.participant.language_changed
  partitionKey: meetingId
```

---

# Events Consumed

| Event | Source Feature | Handler |
|-------|----------------|---------|
| `MeetingStartedEvent` | feature-meeting/lifecycle | Prepare translation infrastructure |
| `MeetingEndedEvent` | feature-meeting/lifecycle | Terminate all sessions, initiate privacy cleanup |
| `ParticipantJoinedEvent` | feature-meeting/participants | Register participant language preference |
| `ParticipantLeftEvent` | feature-meeting/participants | Remove participant from router, check if session can be terminated |

---

# Event Choreography

## Scenario: Participant Selects Arabic Translation

```
Participant calls POST /translation/start {targetLanguage: "ar"}
  ↓
[No existing Arabic session]
  ↓
TranslationGateway.startSession(meetingId, sourceLanguage=AUTO, targetLanguage="ar")
  ↓
AITranslationController.connect(GeminiLiveTranslateConfig)
  ↓
Session ACTIVE
  ↓
PUBLISH: TranslationSessionStartedEvent
  ↓
TranslationRouter.addParticipantLanguagePreference(participantId, "ar")
  ↓
API returns {sessionId, audioTrackId, status: ACTIVE}
```

## Scenario: Meeting Ends

```
RECEIVE: MeetingEndedEvent
  ↓
TranslationGateway.stopAllSessions(meetingId)
  ↓
For each active session:
  AITranslationController.disconnect()
  ↓
  PUBLISH: TranslationSessionTerminatedEvent {reason: MEETING_ENDED}
  ↓
TranslationPrivacyLayer.destroySessionData(sessionId)
  ↓
All data deleted within 5 minutes of MeetingEndedEvent
```

## Scenario: Session Disconnect + Reconnect

```
WebSocket disconnects
  ↓
PUBLISH: TranslationErrorEvent {errorCode: "WEBSOCKET_DISCONNECT", isRecoverable: true, retryAttempt: 0}
  ↓
Retry 1: Wait 1 second → reconnect
  ↓
Success
  ↓
Session resumes
  ↓
Participants continue receiving translated audio
```

---

# Privacy Guarantee

The following events do NOT contain audio content:
- `LiveTranslationDeliveredEvent` — contains only metadata and latency.
- `TranscriptSegmentDeliveredEvent` — contains text only; no audio.

Audio content NEVER leaves the real-time stream (LiveKit + Gemini WebSocket).

---

End of Document