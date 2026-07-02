import type {
  IsoDateString,
  MeetingId,
  ParticipantId,
  TranslationSegmentId,
  TranslationSessionId,
} from '@aimeetx/types';

// ============================================================================
// Translation Session Status
// ============================================================================

/**
 * Translation session status.
 *
 * Per `feature-translation/SPECIFICATION.md`: session lifecycle states.
 * States: CONNECTING → ACTIVE → PAUSED → TERMINATED | ERROR
 */
export type TranslationSessionStatus = 'connecting' | 'active' | 'paused' | 'terminated' | 'error';

// ============================================================================
// Translation Session
// ============================================================================

/**
 * Live translation session.
 *
 * Per `feature-translation/SPECIFICATION.md`: represents a single connection
 * to Gemini Live Translate API. One session = one source-to-target language pair.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 */
export interface TranslationSession {
  readonly id: TranslationSessionId;
  readonly meetingId: MeetingId;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly status: TranslationSessionStatus;
  readonly startedAt: IsoDateString;
  readonly endedAt: IsoDateString | null;
  readonly lastHeartbeatAt: IsoDateString | null;
  readonly error: TranslationSessionError | null;
}

// ============================================================================
// Transcript Segment
// ============================================================================

/**
 * Transcript segment from translation.
 *
 * Per `feature-translation/SPECIFICATION.md`: transcript segment delivered
 * from Gemini Live Translate session.
 */
export interface TranscriptSegment {
  readonly id: TranslationSegmentId;
  readonly sessionId: TranslationSessionId;
  readonly meetingId: MeetingId;
  readonly speakerName: string;
  readonly speakerParticipantId: ParticipantId | null;
  readonly originalText: string;
  readonly translatedText: string;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly startTimestamp: IsoDateString;
  readonly endTimestamp: IsoDateString;
  readonly confidence: number;
}

// ============================================================================
// Translated Audio Chunk
// ============================================================================

/**
 * Translated audio chunk.
 *
 * Per `feature-translation/SPECIFICATION.md`: translated PCM audio chunk
 * streamed from Gemini Live Translate API.
 */
export interface TranslatedAudioChunk {
  readonly sessionId: TranslationSessionId;
  readonly meetingId: MeetingId;
  readonly targetLanguage: string;
  readonly pcmData: ArrayBuffer;
  readonly sampleRate: number;
  readonly bitDepth: number;
  readonly channels: number;
  readonly timestamp: IsoDateString;
  readonly durationMs: number;
}

// ============================================================================
// Translation Session Error
// ============================================================================

/**
 * Translation session error types.
 *
 * Per `feature-translation/SPECIFICATION.md`: error types and recovery actions.
 */
export type TranslationSessionError =
  | { readonly code: 'WebSocketDisconnected'; readonly message: string; readonly retryCount: number }
  | { readonly code: 'ApiQuotaExceeded'; readonly message: string }
  | { readonly code: 'InvalidAudioFormat'; readonly message: string }
  | { readonly code: 'SessionTimeout'; readonly message: string }
  | { readonly code: 'AuthenticationFailed'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };

// ============================================================================
// Translation Language Preference
// ============================================================================

/**
 * Participant translation language preference.
 *
 * Per `feature-translation/SPECIFICATION.md`: maps participants to their
 * target language for translation routing.
 */
export interface TranslationLanguagePreference {
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly targetLanguage: string;
  readonly setAt: IsoDateString;
}

// ============================================================================
// Gemini Live Translate Configuration
// ============================================================================

/**
 * Gemini Live Translate API configuration.
 *
 * Per `feature-translation/SPECIFICATION.md`: configuration for connecting
 * to Gemini Live Translate API.
 */
export interface GeminiLiveTranslateConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly enableOriginalTranscript: boolean;
  readonly enableTranslatedTranscript: boolean;
  readonly enableTranslatedAudio: boolean;
}

/**
 * Default Gemini Live Translate configuration.
 */
export const DEFAULT_GEMINI_LIVE_TRANSLATE_CONFIG: Omit<GeminiLiveTranslateConfig, 'apiKey' | 'sourceLanguage' | 'targetLanguage'> = {
  model: 'gemini-3.5-live-translate-preview',
  enableOriginalTranscript: true,
  enableTranslatedTranscript: true,
  enableTranslatedAudio: true,
} as const;

// ============================================================================
// Translation Constraints
// ============================================================================

/**
 * Translation constraints.
 *
 * Per `feature-translation/SPECIFICATION.md`: system limits and constraints.
 */
export const TRANSLATION_CONSTRAINTS = {
  MAX_SESSIONS_PER_MEETING: 10,
  MAX_RECONNECT_ATTEMPTS: 3,
  RECONNECT_BASE_DELAY_MS: 1000,
  RECONNECT_MAX_DELAY_MS: 8000,
  HEARTBEAT_INTERVAL_MS: 30000,
  SESSION_TIMEOUT_MS: 300000, // 5 minutes
  AUDIO_SAMPLE_RATE: 16000,
  AUDIO_BIT_DEPTH: 16,
  AUDIO_CHANNELS: 1,
  MAX_AUDIO_CHUNK_SIZE_BYTES: 32000, // 1 second of audio at 16kHz, 16-bit, mono
  TARGET_TRANSLATION_LATENCY_MS: 800,
  TARGET_TRANSCRIPT_LATENCY_MS: 1200,
} as const;

// ============================================================================
// Translation Errors
// ============================================================================

/**
 * Translation error types.
 *
 * Per feature-translation API specifications: error codes.
 */
export type TranslationError =
  | { readonly code: 'TranslationSessionNotFound'; readonly message: string }
  | { readonly code: 'TranslationSessionAlreadyActive'; readonly message: string }
  | { readonly code: 'MaxSessionsExceeded'; readonly message: string; readonly maxSessions: number }
  | { readonly code: 'InvalidLanguageCode'; readonly message: string }
  | { readonly code: 'TranslationSessionError'; readonly message: string; readonly error: TranslationSessionError }
  | { readonly code: 'MeetingNotFound'; readonly message: string }
  | { readonly code: 'PermissionDenied'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };