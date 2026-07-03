/**
 * @aimeetx/types — Shared TypeScript types for the AI MeetX platform.
 *
 * This package contains pure type definitions and small utility functions
 * that are shared across all other packages. It has zero runtime dependencies.
 *
 * Per ADR-004 (Clean Architecture): this package is the lowest layer of the
 * dependency graph and may be imported by any other package.
 */

export type { Brand } from './branded.js';
export { brand } from './branded.js';
export type {
  UserId,
  MeetingId,
  ParticipantId,
  MessageId,
  ConversationId,
  SessionId,
  DeviceId,
  OrganizationId,
  RecordingId,
  NotificationId,
  TranslationSegmentId,
  AttachmentId,
  TranslationSessionId,
  SummaryId,
  ActionItemId,
  ReportId,
  ClassroomSessionId,
  QuizId,
  AttendanceId,
  BreakoutRoomId,
  IsoDateString,
  Uuid,
} from './branded.js';

export type { Result } from './result.js';
export { success, failure, isSuccess, isFailure, map, mapError, flatMap, unwrap } from './result.js';

export type { DomainEvent, EventMetadata } from './domain-event.js';