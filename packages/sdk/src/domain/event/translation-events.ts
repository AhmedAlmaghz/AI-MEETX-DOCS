import type {
  DomainEvent,
  IsoDateString,
  MeetingId,
  ParticipantId,
  TranslationSegmentId,
  TranslationSessionId,
} from '@aimeetx/types';

import type { TranslationSessionError, TranslationSessionStatus } from '../model/translation.js';

// ============================================================================
// Translation Session Events
// ============================================================================

/**
 * TranslationSessionStartedEvent — published when a translation session is established.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered after Gemini session creation.
 */
export interface TranslationSessionStartedEvent extends DomainEvent {
  readonly eventType: 'TranslationSessionStarted';
  readonly payload: {
    readonly sessionId: TranslationSessionId;
    readonly meetingId: MeetingId;
    readonly sourceLanguage: string;
    readonly targetLanguage: string;
    readonly startedAt: IsoDateString;
  };
}

/**
 * TranslationSessionTerminatedEvent — published when a translation session ends.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered after session termination.
 */
export interface TranslationSessionTerminatedEvent extends DomainEvent {
  readonly eventType: 'TranslationSessionTerminated';
  readonly payload: {
    readonly sessionId: TranslationSessionId;
    readonly meetingId: MeetingId;
    readonly reason: 'meeting_ended' | 'user_action' | 'error' | 'timeout' | 'system_cleanup';
    readonly terminatedAt: IsoDateString;
  };
}

/**
 * TranslationSessionStatusChangedEvent — published when session status changes.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered on status transitions.
 */
export interface TranslationSessionStatusChangedEvent extends DomainEvent {
  readonly eventType: 'TranslationSessionStatusChanged';
  readonly payload: {
    readonly sessionId: TranslationSessionId;
    readonly meetingId: MeetingId;
    readonly previousStatus: TranslationSessionStatus;
    readonly newStatus: TranslationSessionStatus;
    readonly changedAt: IsoDateString;
  };
}

/**
 * TranslationSessionErrorEvent — published when a session error occurs.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered on session errors.
 */
export interface TranslationSessionErrorEvent extends DomainEvent {
  readonly eventType: 'TranslationSessionError';
  readonly payload: {
    readonly sessionId: TranslationSessionId;
    readonly meetingId: MeetingId;
    readonly error: TranslationSessionError;
    readonly occurredAt: IsoDateString;
  };
}

// ============================================================================
// Translation Delivery Events
// ============================================================================

/**
 * LiveTranslationDeliveredEvent — published when translated audio is delivered.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered after translated audio
 * chunk is received from Gemini and distributed to listeners.
 */
export interface LiveTranslationDeliveredEvent extends DomainEvent {
  readonly eventType: 'LiveTranslationDelivered';
  readonly payload: {
    readonly sessionId: TranslationSessionId;
    readonly meetingId: MeetingId;
    readonly targetLanguage: string;
    readonly durationMs: number;
    readonly deliveredAt: IsoDateString;
  };
}

/**
 * TranscriptSegmentDeliveredEvent — published when a transcript segment is available.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered after transcript segment
 * is received from Gemini and ready for subtitle display.
 */
export interface TranscriptSegmentDeliveredEvent extends DomainEvent {
  readonly eventType: 'TranscriptSegmentDelivered';
  readonly payload: {
    readonly segmentId: TranslationSegmentId;
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
    readonly deliveredAt: IsoDateString;
  };
}

// ============================================================================
// Translation Language Preference Events
// ============================================================================

/**
 * TranslationLanguagePreferenceSetEvent — published when a participant sets their target language.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered after language preference change.
 */
export interface TranslationLanguagePreferenceSetEvent extends DomainEvent {
  readonly eventType: 'TranslationLanguagePreferenceSet';
  readonly payload: {
    readonly participantId: ParticipantId;
    readonly meetingId: MeetingId;
    readonly targetLanguage: string;
    readonly setAt: IsoDateString;
  };
}

/**
 * TranslationLanguagePreferenceRemovedEvent — published when a participant removes their language preference.
 *
 * Per `feature-translation/SPECIFICATION.md`: triggered after language preference removal.
 */
export interface TranslationLanguagePreferenceRemovedEvent extends DomainEvent {
  readonly eventType: 'TranslationLanguagePreferenceRemoved';
  readonly payload: {
    readonly participantId: ParticipantId;
    readonly meetingId: MeetingId;
    readonly previousTargetLanguage: string;
    readonly removedAt: IsoDateString;
  };
}

// ============================================================================
// Event Union Types
// ============================================================================

/**
 * Union of all translation session events.
 */
export type TranslationSessionEvent =
  | TranslationSessionStartedEvent
  | TranslationSessionTerminatedEvent
  | TranslationSessionStatusChangedEvent
  | TranslationSessionErrorEvent;

/**
 * Union of all translation delivery events.
 */
export type TranslationDeliveryEvent =
  | LiveTranslationDeliveredEvent
  | TranscriptSegmentDeliveredEvent;

/**
 * Union of all translation language preference events.
 */
export type TranslationLanguagePreferenceEvent =
  | TranslationLanguagePreferenceSetEvent
  | TranslationLanguagePreferenceRemovedEvent;

/**
 * Union of all translation-related domain events.
 */
export type TranslationEvent =
  | TranslationSessionEvent
  | TranslationDeliveryEvent
  | TranslationLanguagePreferenceEvent;