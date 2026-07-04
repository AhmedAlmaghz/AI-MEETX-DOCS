/**
 * @aimeetx/sdk — Translation module.
 *
 * Per ADR-001 + ADR-005: this is the ONLY module in the SDK that may call
 * the Gemini Live Translate API. All other SDK modules (and clients) must
 * consume translation via the public interfaces and event bus defined here.
 *
 * Per ADR-001 cost optimization: one Gemini session per TARGET LANGUAGE per
 * meeting (not per participant). Sessions are managed by the
 * TranslationGateway implementation; the use cases and consumers interact
 * with the gateway and event stream only.
 *
 * Architectural rules (binding):
 * - This directory is the only place `gemini-3.5-live-translate-preview` is imported.
 * - Domain types live in `../domain/model/translation.js`.
 * - The gateway implementation lives in `../data/gemini-translation-controller.js`.
 * - This module re-exports both for ergonomic single-import consumption.
 */

export type {
  TranslationSessionStatus,
  TranslationSession,
  TranscriptSegment,
  TranslatedAudioChunk,
  TranslationSessionError,
  TranslationLanguagePreference,
  GeminiLiveTranslateConfig,
  TranslationError,
} from '../domain/model/translation.js';
export { TRANSLATION_CONSTRAINTS, DEFAULT_GEMINI_LIVE_TRANSLATE_CONFIG } from '../domain/model/translation.js';

export type {
  CreateTranslationSessionInput,
  TranslationSessionRepository,
  TranscriptRepository,
  TranslationRouter,
  TranslationGateway,
  TranslationPrivacyLayer,
} from '../domain/port/translation-repository.js';

export type {
  TranslationSessionStartedEvent,
  TranslationSessionTerminatedEvent,
  TranslationSessionStatusChangedEvent,
  TranslationSessionErrorEvent,
  LiveTranslationDeliveredEvent,
  TranscriptSegmentDeliveredEvent,
  TranslationLanguagePreferenceSetEvent,
  TranslationLanguagePreferenceRemovedEvent,
  TranslationSessionEvent,
  TranslationDeliveryEvent,
  TranslationLanguagePreferenceEvent,
  TranslationEvent,
} from '../domain/event/translation-events.js';

export {
  StartTranslationUseCase,
  StopTranslationUseCase,
  ChangeTargetLanguageUseCase,
  StreamAudioToTranslationUseCase,
  GetActiveTranslationSessionsUseCase,
} from '../domain/usecase/translation-use-cases.js';

export { GeminiTranslationController } from '../data/gemini-translation-controller.js';
