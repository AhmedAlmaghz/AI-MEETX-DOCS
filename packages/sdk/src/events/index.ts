/**
 * @aimeetx/sdk — Events layer.
 *
 * Per ADR-005: this directory re-exports the event bus and event types
 * from @aimeetx/events so consumers only need a single SDK import.
 *
 * Per ADR-002's surviving rules: cross-module communication in the SDK
 * happens ONLY through the typed event bus. This re-export ensures the
 * SDK is the only entry point for consumers.
 */

import type { DomainEvent } from '@aimeetx/types';

export type { EventBus } from '@aimeetx/events';
export type SdkEvent = DomainEvent;
export { InMemoryEventBus } from '@aimeetx/events';

export type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  SessionExpiredEvent,
  SessionRefreshedEvent,
  AuthEvent,
} from '../domain/event/auth-events.js';
export type {
  MeetingCreatedEvent,
  MeetingStartedEvent,
  MeetingEndedEvent,
  MeetingEvent,
} from '../domain/event/meeting-events.js';
export type {
  TranslationSessionStartedEvent,
  TranslationSessionTerminatedEvent,
  LiveTranslationDeliveredEvent,
  TranslationEvent,
} from '../domain/event/translation-events.js';
export type {
  MeetingSummaryGeneratedEvent,
  ActionItemDetectedEvent,
  MeetingReportReadyEvent,
  AiEvent,
} from '../domain/event/ai-events.js';
export type {
  RecordingStartedEvent,
  RecordingStoppedEvent,
  RecordingReadyEvent,
  RecordingFailedEvent,
  RecordingEvent,
} from '../domain/event/recording-events.js';
