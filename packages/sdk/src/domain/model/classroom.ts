import type {
  AttendanceId,
  BreakoutRoomId,
  ClassroomSessionId,
  IsoDateString,
  MeetingId,
  ParticipantId,
  QuizId,
} from '@aimeetx/types';

// ============================================================================
// Classroom Status
// ============================================================================

/**
 * Classroom session status.
 *
 * Per `feature-classroom/SPECIFICATION.md`: classroom state machine values.
 * States: ACTIVE → PAUSED → ENDED
 */
export type ClassroomStatus = 'active' | 'paused' | 'ended';

// ============================================================================
// Quiz Status
// ============================================================================

/**
 * Quiz status.
 *
 * Per `feature-classroom/SPECIFICATION.md`: quiz state values.
 * States: DRAFT → ACTIVE → CLOSED
 */
export type QuizStatus = 'draft' | 'active' | 'closed';

// ============================================================================
// Quiz Option
// ============================================================================

/**
 * Quiz option (answer choice).
 *
 * Per `feature-classroom/SPECIFICATION.md`: quiz option value object.
 */
export interface QuizOption {
  readonly id: string;
  readonly text: string;
}

// ============================================================================
// Quiz Response
// ============================================================================

/**
 * Quiz response from a participant.
 *
 * Per `feature-classroom/SPECIFICATION.md`: participant's answer submission.
 */
export interface QuizResponse {
  readonly participantId: ParticipantId;
  readonly selectedOptionId: string;
  readonly submittedAt: IsoDateString;
}

// ============================================================================
// Classroom Session (Aggregate Root)
// ============================================================================

/**
 * Classroom session aggregate root.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `feature-classroom/SPECIFICATION.md`: ClassroomSession is the root entity.
 */
export interface ClassroomSession {
  readonly id: ClassroomSessionId;
  readonly meetingId: MeetingId;
  readonly status: ClassroomStatus;
  readonly allowStudentWhiteboard: boolean;
  readonly breakoutRooms: ReadonlyArray<BreakoutRoom>;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

// ============================================================================
// Attendance Record (Entity)
// ============================================================================

/**
 * Attendance record for a participant in a classroom session.
 *
 * Per `feature-classroom/SPECIFICATION.md`: tracks participant attendance.
 */
export interface AttendanceRecord {
  readonly id: AttendanceId;
  readonly classroomSessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly joinedAt: IsoDateString;
  readonly leftAt: IsoDateString | null;
  readonly totalDurationMinutes: number;
}

// ============================================================================
// Quiz (Entity)
// ============================================================================

/**
 * Quiz entity for classroom assessments.
 *
 * Per `feature-classroom/SPECIFICATION.md`: quiz entity with options and responses.
 */
export interface Quiz {
  readonly id: QuizId;
  readonly classroomSessionId: ClassroomSessionId;
  readonly question: string;
  readonly options: ReadonlyArray<QuizOption>;
  readonly correctOptionId: string | null;
  readonly showCorrectAnswer: boolean;
  readonly status: QuizStatus;
  readonly responses: ReadonlyArray<QuizResponse>;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

// ============================================================================
// Breakout Room (Value Object)
// ============================================================================

/**
 * Breakout room for small group discussions.
 *
 * Per `feature-classroom/SPECIFICATION.md`: breakout room value object.
 */
export interface BreakoutRoom {
  readonly id: BreakoutRoomId;
  readonly name: string;
  readonly livekitRoomName: string;
  readonly assignedParticipants: ReadonlyArray<ParticipantId>;
}

// ============================================================================
// Breakout Room Config (Input)
// ============================================================================

/**
 * Configuration for creating a breakout room.
 *
 * Per `feature-classroom/SPECIFICATION.md`: input for breakout room creation.
 */
export interface BreakoutRoomConfig {
  readonly name: string;
  readonly assignedParticipants: ReadonlyArray<ParticipantId>;
}

// ============================================================================
// Classroom Constraints
// ============================================================================

/**
 * Classroom constraints.
 *
 * Per `feature-classroom/SPECIFICATION.md`: classroom limits.
 */
export const CLASSROOM_CONSTRAINTS = {
  MAX_QUESTION_LENGTH: 1000,
  MIN_QUESTION_LENGTH: 1,
  MAX_OPTION_TEXT_LENGTH: 500,
  MIN_OPTION_TEXT_LENGTH: 1,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 10,
  MAX_BREAKOUT_ROOMS: 20,
  MIN_BREAKOUT_ROOMS: 2,
  MAX_ROOM_NAME_LENGTH: 128,
  MIN_ROOM_NAME_LENGTH: 1,
} as const;

// ============================================================================
// Classroom Errors
// ============================================================================

/**
 * Classroom error types.
 *
 * Per feature-classroom API specifications: error codes.
 */
export type ClassroomError =
  | { readonly code: 'ClassroomSessionNotFound'; readonly message: string }
  | { readonly code: 'ClassroomSessionAlreadyEnded'; readonly message: string }
  | { readonly code: 'QuizNotFound'; readonly message: string }
  | { readonly code: 'QuizAlreadyClosed'; readonly message: string }
  | { readonly code: 'QuizNotActive'; readonly message: string }
  | { readonly code: 'DuplicateQuizResponse'; readonly message: string }
  | { readonly code: 'InvalidQuizOption'; readonly message: string }
  | { readonly code: 'InsufficientRole'; readonly message: string; readonly required: string; readonly actual: string }
  | { readonly code: 'BreakoutRoomNotFound'; readonly message: string }
  | { readonly code: 'MaxBreakoutRoomsExceeded'; readonly message: string }
  | { readonly code: 'AttendanceRecordNotFound'; readonly message: string }
  | { readonly code: 'Unauthorized'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'ServerError'; readonly message: string; readonly status?: number }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };