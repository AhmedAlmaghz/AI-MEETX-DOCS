# feature-translation/SPECIFICATION.md

Document ID: TRANSLATION-SPEC-001

Version: 2.0.0

Status: Approved

Feature: Real-Time Translation

Priority: P0

Owner: AI & Localization Team

Classification: Mandatory

---

# Revision History

| Version | Change                                              |
|---------|-----------------------------------------------------|
| 1.0.0   | Initial draft (STT → Translation → TTS pipeline)   |
| 2.0.0   | **Major revision:** Replaced pipeline with Gemini Live Translate Speech-to-Speech model |

---

# 1. Purpose

This document defines the architecture, domain models, and processing pipelines for the Real-Time Translation feature.

This version supersedes the original design that used a manual STT → Translation → TTS pipeline.

The system now uses **Gemini Live Translate** (`gemini-3.5-live-translate-preview`) — a Speech-to-Speech translation model — as the primary translation engine.

---

# 2. Architectural Decision

## Why Gemini Live Translate?

The original pipeline assumed:

```
Audio
  ↓
Whisper (Speech-to-Text)
  ↓
Translation Model
  ↓
Text-to-Speech Synthesis
  ↓
Listener
```

This approach had the following problems:
- High end-to-end latency (3–6 seconds).
- Unnatural synthesized voice output.
- High infrastructure complexity.
- Separate model integrations required.

## New Architecture

Using `gemini-3.5-live-translate-preview`, the model:
- Accepts **audio directly** via WebSocket streaming.
- Returns **translated audio** directly.
- Also returns the **original transcript** and **translated transcript** simultaneously.
- Requires **zero** manual STT, translation, or TTS infrastructure.

```
Participant Audio
       │
       ▼
LiveKit Audio Track
       │
       ▼
AI Translation Gateway
       │
       ▼
Gemini Live Translate Session
       │
       ├────────► Original Transcript (text)
       │
       ├────────► Translated Transcript (text)
       │
       ▼
Translated Audio Stream
       │
       ▼
Target Participants (via LiveKit)
```

---

# 3. Core Principle: Sessions Per Language, Not Per Participant

The previous design created one translation session per participant, which was expensive.

The new design creates **one Gemini session per target language** inside a meeting.

Example: A meeting with 50 participants — 20 Arabic listeners, 15 English listeners, 10 French listeners, 5 Spanish listeners.

We create exactly **4 Gemini sessions**:

```
Meeting [source: mixed]
  ├── Session: → Arabic   (serves 20 participants)
  ├── Session: → English  (serves 15 participants)
  ├── Session: → French   (serves 10 participants)
  └── Session: → Spanish  (serves 5 participants)
```

This reduces cost by 90%+ compared to per-participant sessions.

---

# 4. Components

## 4.1 TranslationGateway

The central orchestrator of all translation sessions for a meeting.

### Responsibilities:
- Create and manage Gemini Live Translate sessions.
- Route incoming speaker audio to the correct session input.
- Distribute translated audio to the correct listener groups.
- Handle session reconnection and error recovery.

```kotlin
interface TranslationGateway {
    suspend fun startSession(
        meetingId: MeetingId,
        sourceLanguage: String,
        targetLanguage: String
    ): Result<TranslationSessionId>

    suspend fun stopSession(sessionId: TranslationSessionId): Result<Unit>

    suspend fun sendAudio(sessionId: TranslationSessionId, audioChunk: ByteArray): Result<Unit>

    fun observeTranslatedAudio(sessionId: TranslationSessionId): Flow<TranslatedAudioChunk>

    fun observeTranscript(sessionId: TranslationSessionId): Flow<TranscriptSegment>
}
```

---

## 4.2 LiveTranslationSession

Represents a single connection to Gemini Live Translate API.

One session = one source-to-target language pair.

```kotlin
data class LiveTranslationSession(
    val sessionId: TranslationSessionId,
    val meetingId: MeetingId,
    val sourceLanguage: String,
    val targetLanguage: String,
    val startedAt: Instant,
    val status: SessionStatus
)

enum class SessionStatus {
    CONNECTING, ACTIVE, PAUSED, TERMINATED, ERROR
}
```

---

## 4.3 AITranslationController

Handles the WebSocket connection to the Gemini Live Translate API.

### Protocol:
- Connection: WebSocket over TLS.
- Input: PCM audio chunks at 16kHz, 16-bit, mono.
- Output: Translated PCM audio + transcript JSON.
- Heartbeat: Every 30 seconds.
- Reconnect: Automatic with exponential backoff.

```kotlin
interface AITranslationController {
    suspend fun connect(config: GeminiLiveTranslateConfig): Result<Unit>
    suspend fun sendAudioChunk(audio: ByteArray): Result<Unit>
    fun receiveTranslatedAudio(): Flow<ByteArray>
    fun receiveTranscript(): Flow<TranscriptEvent>
    suspend fun disconnect(): Result<Unit>
}

data class GeminiLiveTranslateConfig(
    val apiKey: String,
    val model: String = "gemini-3.5-live-translate-preview",
    val sourceLanguage: String,
    val targetLanguage: String,
    val enableOriginalTranscript: Boolean = true,
    val enableTranslatedTranscript: Boolean = true
)
```

---

## 4.4 TranslationRouter

Routes incoming audio from the correct speaker to all active sessions.
Routes translated audio from each session to the correct set of listeners.

```kotlin
interface TranslationRouter {
    fun addParticipantLanguagePreference(
        participantId: ParticipantId,
        targetLanguage: String
    )

    fun removeParticipant(participantId: ParticipantId)

    fun getSessionForLanguage(targetLanguage: String): TranslationSessionId?

    fun getListenersForLanguage(targetLanguage: String): List<ParticipantId>
}
```

---

## 4.5 TranslationPrivacyLayer

Enforces data privacy rules.

```kotlin
interface TranslationPrivacyLayer {
    // No original audio is persisted.
    // No translated audio is persisted.
    // No transcripts are stored unless explicitly opted-in.
    // All sessions are terminated immediately after meeting end.
    fun isRecordingAllowed(meetingId: MeetingId): Boolean
    suspend fun destroySessionData(sessionId: TranslationSessionId): Result<Unit>
}
```

**Privacy Rules:**
- Original audio is NOT stored.
- Translated audio is NOT stored.
- Transcripts are stored ONLY if the meeting host explicitly enables recording and the participant consents.
- All sessions MUST be destroyed within 5 minutes of `MeetingEndedEvent`.

---

# 5. Session Lifecycle

```
User selects target language
        ↓
TranslationRouter checks if session for that language exists
        ↓
  [Session exists]      [No session]
        ↓                    ↓
Route user to session   TranslationGateway.startSession()
                             ↓
                        AITranslationController.connect()
                             ↓
                        Session ACTIVE
                             ↓
                        Audio streams flow
```

---

# 6. Audio Flow

```
Speaker talks
  ↓
LiveKit captures audio
  ↓
TranslationGateway receives speaker audio
  ↓
Sends PCM audio chunks to all active Gemini sessions
  ↓
Gemini returns:
  ├── Translated PCM audio (streamed)
  └── Transcript segments (JSON, streamed)
  ↓
TranslationGateway distributes:
  ├── Translated audio → LiveKit audio track for that language group
  └── Transcripts → TranslationDeliveredEvent (for subtitle display)
```

---

# 7. Domain Events

All events published by the Translation feature:

| Event | When |
|-------|------|
| `TranslationSessionStartedEvent` | Session established with Gemini |
| `TranslationSessionTerminatedEvent` | Session ended |
| `LiveTranslationDeliveredEvent` | Translated audio segment delivered |
| `TranscriptSegmentDeliveredEvent` | Text transcript segment available |
| `TranslationErrorEvent` | Session error or disconnection |

---

# 8. Error Handling

| Error | Recovery Action |
|-------|----------------|
| WebSocket disconnect | Retry with exponential backoff (max 3 attempts) |
| API quota exceeded | Notify host, fallback to text-only subtitles |
| Invalid audio format | Log error, skip chunk, continue session |
| Session timeout | Create new session, re-connect listeners |

---

# 9. Non-Functional Requirements

| Metric | Target |
|--------|--------|
| Translation latency (audio) | < 800ms p95 |
| Transcript delivery latency | < 1200ms p95 |
| Session creation time | < 2 seconds |
| Session reconnect time | < 5 seconds |
| Maximum concurrent sessions per meeting | 10 languages |

---

# 10. Technology Stack

| Component | Technology |
|-----------|------------|
| Translation Engine | `gemini-3.5-live-translate-preview` via Gemini Live API |
| Audio Transport | LiveKit SDK (WebRTC audio tracks) |
| Connection Protocol | WebSocket over TLS |
| Audio Format | PCM 16kHz, 16-bit, mono |
| Session Management | Kotlin Coroutines + StateFlow |
| Error Recovery | Exponential backoff with Kotlin retry utilities |

---

# 11. Module Structure

```
feature-translation/
├── domain/
│   ├── model/
│   │   ├── TranslationSession.kt
│   │   ├── TranscriptSegment.kt
│   │   ├── TranslatedAudioChunk.kt
│   │   └── TranslationError.kt
│   ├── usecase/
│   │   ├── StartTranslationUseCase.kt
│   │   ├── StopTranslationUseCase.kt
│   │   └── ChangeTargetLanguageUseCase.kt
│   └── port/
│       ├── TranslationGateway.kt
│       ├── TranslationRouter.kt
│       └── TranslationPrivacyLayer.kt
├── data/
│   ├── gemini/
│   │   ├── GeminiLiveTranslateConfig.kt
│   │   ├── AITranslationController.kt
│   │   └── GeminiTranslationGateway.kt
│   └── repository/
│       └── TranscriptRepository.kt
├── presentation/
│   ├── viewmodel/
│   │   └── TranslationViewModel.kt
│   └── component/
│       ├── SubtitleOverlay.kt
│       └── LanguageSelector.kt
└── di/
    └── TranslationModule.kt
```

---

# 12. Acceptance Criteria

- Each language session is created on demand and serves all participants sharing that target language.
- Translated audio reaches listeners within 800ms p95.
- Text subtitles appear within 1200ms p95.
- Sessions are destroyed within 5 minutes of `MeetingEndedEvent`.
- No audio data is persisted unless recording is explicitly enabled.
- Maximum 10 language sessions per meeting.
- Reconnection is automatic within 5 seconds.

---

End of Document