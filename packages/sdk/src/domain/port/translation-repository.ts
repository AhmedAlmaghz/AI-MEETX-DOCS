import type {
  MeetingId,
  ParticipantId,
  Result,
  TranslationSegmentId,
  TranslationSessionId,
} from '@aimeetx/types';

import type {
  GeminiLiveTranslateConfig,
  TranscriptSegment,
  TranslatedAudioChunk,
  TranslationLanguagePreference,
  TranslationSession,
} from '../model/translation.js';

// ============================================================================
// Translation Session Repository Port
// ============================================================================

/**
 * Create translation session input.
 *
 * Per `feature-translation/SPECIFICATION.md`: session creation parameters.
 */
export interface CreateTranslationSessionInput {
  readonly meetingId: MeetingId;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
}

/**
 * Translation session repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer.
 *
 * Per `feature-translation/SPECIFICATION.md`: Translation session repository operations.
 */
export interface TranslationSessionRepository {
  /** Create a new translation session. */
  createSession(input: CreateTranslationSessionInput): Promise<Result<TranslationSession, Error>>;

  /** Get a translation session by ID. */
  getSession(sessionId: TranslationSessionId): Promise<Result<TranslationSession | null, Error>>;

  /** Get all active sessions for a meeting. */
  getActiveSessionsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<TranslationSession>, Error>>;

  /** Get session by meeting and target language. */
  getSessionByLanguage(
    meetingId: MeetingId,
    targetLanguage: string,
  ): Promise<Result<TranslationSession | null, Error>>;

  /** Update session status. */
  updateSessionStatus(
    sessionId: TranslationSessionId,
    status: TranslationSession['status'],
  ): Promise<Result<TranslationSession, Error>>;

  /** Update session heartbeat. */
  updateHeartbeat(sessionId: TranslationSessionId): Promise<Result<TranslationSession, Error>>;

  /** Terminate a session. */
  terminateSession(
    sessionId: TranslationSessionId,
    reason: 'meeting_ended' | 'user_action' | 'error' | 'timeout' | 'system_cleanup',
  ): Promise<Result<TranslationSession, Error>>;

  /** Terminate all sessions for a meeting. */
  terminateAllSessionsForMeeting(
    meetingId: MeetingId,
    reason: 'meeting_ended' | 'user_action' | 'error' | 'timeout' | 'system_cleanup',
  ): Promise<Result<number, Error>>;

  /** Count active sessions for a meeting. */
  countActiveSessions(meetingId: MeetingId): Promise<Result<number, Error>>;
}

// ============================================================================
// Transcript Repository Port
// ============================================================================

/**
 * Transcript repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer.
 *
 * Per `feature-translation/SPECIFICATION.md`: Transcript repository operations.
 * Note: Transcripts are only stored if explicitly opted-in by meeting host.
 */
export interface TranscriptRepository {
  /** Save a transcript segment. */
  saveSegment(segment: TranscriptSegment): Promise<Result<TranscriptSegment, Error>>;

  /** Get a transcript segment by ID. */
  getSegment(segmentId: TranslationSegmentId): Promise<Result<TranscriptSegment | null, Error>>;

  /** Get transcript segments for a session. */
  getSegmentsBySession(
    sessionId: TranslationSessionId,
    options?: { readonly limit?: number },
  ): Promise<Result<ReadonlyArray<TranscriptSegment>, Error>>;

  /** Get transcript segments for a meeting. */
  getSegmentsByMeeting(
    meetingId: MeetingId,
    options?: { readonly limit?: number; readonly language?: string },
  ): Promise<Result<ReadonlyArray<TranscriptSegment>, Error>>;

  /** Delete all transcript segments for a meeting (privacy compliance). */
  deleteSegmentsByMeeting(meetingId: MeetingId): Promise<Result<number, Error>>;

  /** Delete all transcript segments for a session. */
  deleteSegmentsBySession(sessionId: TranslationSessionId): Promise<Result<number, Error>>;
}

// ============================================================================
// Translation Router Port
// ============================================================================

/**
 * Translation router port (interface).
 *
 * Per `feature-translation/SPECIFICATION.md`: routes incoming audio from
 * speakers to all active sessions and routes translated audio to listeners.
 */
export interface TranslationRouter {
  /** Add participant language preference. */
  addParticipantLanguagePreference(
    participantId: ParticipantId,
    meetingId: MeetingId,
    targetLanguage: string,
  ): Promise<Result<TranslationLanguagePreference, Error>>;

  /** Remove participant language preference. */
  removeParticipantLanguagePreference(
    participantId: ParticipantId,
    meetingId: MeetingId,
  ): Promise<Result<TranslationLanguagePreference | null, Error>>;

  /** Get participant language preference. */
  getParticipantLanguagePreference(
    participantId: ParticipantId,
    meetingId: MeetingId,
  ): Promise<Result<TranslationLanguagePreference | null, Error>>;

  /** Get all listeners for a target language in a meeting. */
  getListenersForLanguage(
    meetingId: MeetingId,
    targetLanguage: string,
  ): Promise<Result<ReadonlyArray<ParticipantId>, Error>>;

  /** Get all language preferences for a meeting. */
  getLanguagePreferencesForMeeting(
    meetingId: MeetingId,
  ): Promise<Result<ReadonlyArray<TranslationLanguagePreference>, Error>>;

  /** Remove all language preferences for a meeting. */
  removeAllLanguagePreferencesForMeeting(meetingId: MeetingId): Promise<Result<number, Error>>;
}

// ============================================================================
// Translation Gateway Port
// ============================================================================

/**
 * Translation event callbacks.
 *
 * Per `feature-translation/SPECIFICATION.md`: callbacks for translation events.
 */
export interface TranslationEventCallbacks {
  readonly onTranscriptSegment?: (segment: TranscriptSegment) => void;
  readonly onTranslatedAudio?: (chunk: TranslatedAudioChunk) => void;
  readonly onSessionError?: (sessionId: TranslationSessionId, error: Error) => void;
  readonly onSessionClosed?: (sessionId: TranslationSessionId) => void;
}

/**
 * Translation gateway port (interface).
 *
 * Per `feature-translation/SPECIFICATION.md`: the central orchestrator of all
 * translation sessions for a meeting. Manages Gemini Live Translate sessions.
 */
export interface TranslationGateway {
  /** Start a translation session for a language pair. */
  startSession(
    meetingId: MeetingId,
    sourceLanguage: string,
    targetLanguage: string,
    callbacks?: TranslationEventCallbacks,
  ): Promise<Result<TranslationSessionId, Error>>;

  /** Stop a translation session. */
  stopSession(
    sessionId: TranslationSessionId,
    reason: 'meeting_ended' | 'user_action' | 'error' | 'timeout' | 'system_cleanup',
  ): Promise<Result<void, Error>>;

  /** Send audio chunk to a session. */
  sendAudio(
    sessionId: TranslationSessionId,
    audioChunk: ArrayBuffer,
  ): Promise<Result<void, Error>>;

  /** Send audio chunk to all active sessions for a meeting. */
  broadcastAudio(
    meetingId: MeetingId,
    audioChunk: ArrayBuffer,
  ): Promise<Result<number, Error>>;

  /** Get session configuration. */
  getSessionConfig(sessionId: TranslationSessionId): Promise<Result<GeminiLiveTranslateConfig | null, Error>>;

  /** Check if a session is active. */
  isSessionActive(sessionId: TranslationSessionId): Promise<Result<boolean, Error>>;

  /** Destroy all session data (privacy compliance). */
  destroySessionData(sessionId: TranslationSessionId): Promise<Result<void, Error>>;
}

// ============================================================================
// Translation Privacy Layer Port
// ============================================================================

/**
 * Translation privacy layer port (interface).
 *
 * Per `feature-translation/SPECIFICATION.md`: enforces data privacy rules.
 * - No original audio is persisted.
 * - No translated audio is persisted.
 * - No transcripts are stored unless explicitly opted-in.
 * - All sessions are terminated immediately after meeting end.
 */
export interface TranslationPrivacyLayer {
  /** Check if recording is allowed for a meeting. */
  isRecordingAllowed(meetingId: MeetingId): Promise<Result<boolean, Error>>;

  /** Check if transcript storage is allowed for a meeting. */
  isTranscriptStorageAllowed(meetingId: MeetingId): Promise<Result<boolean, Error>>;

  /** Destroy session data (audio, transcripts). */
  destroySessionData(sessionId: TranslationSessionId): Promise<Result<void, Error>>;

  /** Destroy all data for a meeting. */
  destroyMeetingData(meetingId: MeetingId): Promise<Result<void, Error>>;
}