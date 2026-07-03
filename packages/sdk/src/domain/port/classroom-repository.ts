import type {
  AttendanceId,
  ClassroomSessionId,
  MeetingId,
  ParticipantId,
  QuizId,
  Result,
} from '@aimeetx/types';

import type {
  AttendanceRecord,
  BreakoutRoom,
  ClassroomSession,
  Quiz,
  QuizResponse,
} from '../model/classroom.js';

// ============================================================================
// Classroom Repository Port
// ============================================================================

/**
 * Classroom session creation input.
 *
 * Per `feature-classroom/SPECIFICATION.md`: classroom session creation parameters.
 */
export interface CreateClassroomSessionInput {
  readonly meetingId: MeetingId;
  readonly allowStudentWhiteboard?: boolean;
}

/**
 * Classroom session update input.
 *
 * Per `feature-classroom/SPECIFICATION.md`: classroom session update parameters.
 */
export interface ClassroomSessionUpdate {
  readonly status?: ClassroomSession['status'];
  readonly allowStudentWhiteboard?: boolean;
  readonly breakoutRooms?: ReadonlyArray<BreakoutRoom>;
}

/**
 * Classroom repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., HttpClassroomRepository).
 *
 * Per `feature-classroom/SPECIFICATION.md`: Classroom repository operations.
 */
export interface ClassroomRepository {
  /** Create a new classroom session. */
  createSession(
    input: CreateClassroomSessionInput,
  ): Promise<Result<ClassroomSession, Error>>;

  /** Get a classroom session by ID. */
  getSession(
    sessionId: ClassroomSessionId,
  ): Promise<Result<ClassroomSession | null, Error>>;

  /** Get a classroom session by meeting ID. */
  getSessionByMeetingId(
    meetingId: MeetingId,
  ): Promise<Result<ClassroomSession | null, Error>>;

  /** Update a classroom session. */
  updateSession(
    sessionId: ClassroomSessionId,
    update: ClassroomSessionUpdate,
  ): Promise<Result<ClassroomSession, Error>>;

  /** End a classroom session. */
  endSession(
    sessionId: ClassroomSessionId,
  ): Promise<Result<ClassroomSession, Error>>;
}

// ============================================================================
// Quiz Repository Port
// ============================================================================

/**
 * Quiz creation input.
 *
 * Per `feature-classroom/SPECIFICATION.md`: quiz creation parameters.
 */
export interface CreateQuizInput {
  readonly classroomSessionId: ClassroomSessionId;
  readonly question: string;
  readonly options: ReadonlyArray<{ readonly id: string; readonly text: string }>;
  readonly correctOptionId?: string | undefined;
  readonly showCorrectAnswer?: boolean;
}

/**
 * Quiz repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 *
 * Per `feature-classroom/SPECIFICATION.md`: Quiz repository operations.
 */
export interface QuizRepository {
  /** Create a new quiz. */
  createQuiz(input: CreateQuizInput): Promise<Result<Quiz, Error>>;

  /** Get a quiz by ID. */
  getQuiz(quizId: QuizId): Promise<Result<Quiz | null, Error>>;

  /** Get active quiz for a classroom session. */
  getActiveQuizBySessionId(
    sessionId: ClassroomSessionId,
  ): Promise<Result<Quiz | null, Error>>;

  /** Update quiz status. */
  updateQuizStatus(
    quizId: QuizId,
    status: Quiz['status'],
  ): Promise<Result<Quiz, Error>>;

  /** Submit a quiz response. */
  submitResponse(
    quizId: QuizId,
    response: QuizResponse,
  ): Promise<Result<Quiz, Error>>;

  /** Get quiz results (optionId → count). */
  getResults(quizId: QuizId): Promise<Result<ReadonlyMap<string, number>, Error>>;

  /** Delete a quiz. */
  deleteQuiz(quizId: QuizId): Promise<Result<void, Error>>;
}

// ============================================================================
// Attendance Repository Port
// ============================================================================

/**
 * Attendance record creation input.
 *
 * Per `feature-classroom/SPECIFICATION.md`: attendance record creation parameters.
 */
export interface CreateAttendanceInput {
  readonly classroomSessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
}

/**
 * Attendance repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 *
 * Per `feature-classroom/SPECIFICATION.md`: Attendance repository operations.
 */
export interface AttendanceRepository {
  /** Create or update an attendance record (join). */
  recordJoin(input: CreateAttendanceInput): Promise<Result<AttendanceRecord, Error>>;

  /** Record participant leaving. */
  recordLeave(
    attendanceId: AttendanceId,
  ): Promise<Result<AttendanceRecord, Error>>;

  /** Get attendance record by ID. */
  getRecord(
    attendanceId: AttendanceId,
  ): Promise<Result<AttendanceRecord | null, Error>>;

  /** Get all attendance records for a classroom session. */
  getRecordsBySessionId(
    sessionId: ClassroomSessionId,
  ): Promise<Result<ReadonlyArray<AttendanceRecord>, Error>>;

  /** Get attendance record for a participant in a session. */
  getRecordByParticipantAndSession(
    sessionId: ClassroomSessionId,
    participantId: ParticipantId,
  ): Promise<Result<AttendanceRecord | null, Error>>;

  /** Export attendance report as CSV data. */
  exportAttendanceReport(
    sessionId: ClassroomSessionId,
  ): Promise<Result<string, Error>>;
}