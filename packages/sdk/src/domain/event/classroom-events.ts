/**
 * Classroom domain events.
 *
 * Per `feature-classroom/SPECIFICATION.md`: events emitted by the classroom module.
 * Per ADR-004 (Clean Architecture): events are part of the domain layer.
 */

import type {
  ClassroomSessionId,
  IsoDateString,
  MeetingId,
  ParticipantId,
  QuizId,
  UserId,
} from '@aimeetx/types';

// ============================================================================
// Classroom Session Events
// ============================================================================

/**
 * Classroom session created event.
 */
export interface ClassroomSessionCreatedEvent {
  readonly eventType: 'ClassroomSessionCreated';
  readonly sessionId: ClassroomSessionId;
  readonly meetingId: MeetingId;
  readonly createdBy: UserId;
  readonly createdAt: IsoDateString;
}

/**
 * Classroom session ended event.
 */
export interface ClassroomSessionEndedEvent {
  readonly eventType: 'ClassroomSessionEnded';
  readonly sessionId: ClassroomSessionId;
  readonly endedBy: UserId;
  readonly endedAt: IsoDateString;
}

// ============================================================================
// Quiz Events
// ============================================================================

/**
 * Quiz created event.
 */
export interface QuizCreatedEvent {
  readonly eventType: 'QuizCreated';
  readonly quizId: QuizId;
  readonly classroomSessionId: ClassroomSessionId;
  readonly question: string;
  readonly optionsCount: number;
  readonly status: string;
  readonly createdBy: UserId;
  readonly createdAt: IsoDateString;
}

/**
 * Quiz activated event.
 */
export interface QuizActivatedEvent {
  readonly eventType: 'QuizActivated';
  readonly quizId: QuizId;
  readonly activatedBy: UserId;
  readonly activatedAt: IsoDateString;
}

/**
 * Quiz closed event.
 */
export interface QuizClosedEvent {
  readonly eventType: 'QuizClosed';
  readonly quizId: QuizId;
  readonly closedBy: UserId;
  readonly closedAt: IsoDateString;
}

/**
 * Quiz response submitted event.
 */
export interface QuizResponseSubmittedEvent {
  readonly eventType: 'QuizResponseSubmitted';
  readonly quizId: QuizId;
  readonly participantId: ParticipantId;
  readonly selectedOptionId: string;
  readonly totalResponses: number;
  readonly submittedAt: IsoDateString;
}

// ============================================================================
// Breakout Room Events
// ============================================================================

/**
 * Breakout rooms created event.
 */
export interface BreakoutRoomsCreatedEvent {
  readonly eventType: 'BreakoutRoomsCreated';
  readonly sessionId: ClassroomSessionId;
  readonly meetingId: MeetingId;
  readonly roomsCount: number;
  readonly createdBy: UserId;
  readonly createdAt: IsoDateString;
}

// ============================================================================
// Attendance Events
// ============================================================================

/**
 * Attendance recorded event.
 */
export interface AttendanceRecordedEvent {
  readonly eventType: 'AttendanceRecorded';
  readonly attendanceId: string;
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly joinedAt: IsoDateString;
}

// ============================================================================
// Event Union Type
// ============================================================================

/**
 * Union of all classroom events.
 */
export type ClassroomEvent =
  | ClassroomSessionCreatedEvent
  | ClassroomSessionEndedEvent
  | QuizCreatedEvent
  | QuizActivatedEvent
  | QuizClosedEvent
  | QuizResponseSubmittedEvent
  | BreakoutRoomsCreatedEvent
  | AttendanceRecordedEvent;