/**
 * Classroom view model for the web application.
 *
 * Per `feature-classroom/SPECIFICATION.md`: presentation layer for classroom features.
 * This view model manages classroom state and coordinates with the SDK use cases.
 */

import type {
  ClassroomSession,
  Quiz,
  AttendanceRecord,
  BreakoutRoom,
  QuizGradeResult,
  CreateClassroomSessionCommand,
  EndClassroomSessionCommand,
  CreateQuizCommand,
  ActivateQuizCommand,
  CloseQuizCommand,
  SubmitQuizResponseCommand,
  GradeQuizCommand,
  CreateBreakoutRoomsCommand,
  RecordAttendanceCommand,
  ExportAttendanceReportCommand,
} from '@aimeetx/sdk';

// ============================================================================
// Classroom View State
// ============================================================================

/**
 * Classroom view state.
 */
export interface ClassroomViewState {
  readonly session: ClassroomSession | null;
  readonly activeQuiz: Quiz | null;
  readonly attendanceRecords: ReadonlyArray<AttendanceRecord>;
  readonly breakoutRooms: ReadonlyArray<BreakoutRoom>;
  readonly isLoading: boolean;
  readonly error: string | null;
}

/**
 * Initial classroom view state.
 */
export const INITIAL_CLASSROOM_STATE: ClassroomViewState = {
  session: null,
  activeQuiz: null,
  attendanceRecords: [],
  breakoutRooms: [],
  isLoading: false,
  error: null,
} as const;

// ============================================================================
// Classroom Actions
// ============================================================================

/**
 * Classroom actions interface.
 */
export interface ClassroomActions {
  /** Create a new classroom session. */
  createSession(command: CreateClassroomSessionCommand): Promise<ClassroomSession | null>;

  /** End the current classroom session. */
  endSession(command: EndClassroomSessionCommand): Promise<ClassroomSession | null>;

  /** Create a new quiz. */
  createQuiz(command: CreateQuizCommand): Promise<Quiz | null>;

  /** Activate a quiz. */
  activateQuiz(command: ActivateQuizCommand): Promise<Quiz | null>;

  /** Close a quiz. */
  closeQuiz(command: CloseQuizCommand): Promise<Quiz | null>;

  /** Submit a quiz response. */
  submitQuizResponse(command: SubmitQuizResponseCommand): Promise<Quiz | null>;

  /** Grade a quiz. */
  gradeQuiz(command: GradeQuizCommand): Promise<QuizGradeResult | null>;

  /** Create breakout rooms. */
  createBreakoutRooms(command: CreateBreakoutRoomsCommand): Promise<ClassroomSession | null>;

  /** Record attendance. */
  recordAttendance(command: RecordAttendanceCommand): Promise<AttendanceRecord | null>;

  /** Export attendance report as CSV. */
  exportAttendanceReport(command: ExportAttendanceReportCommand): Promise<string | null>;
}

// ============================================================================
// Quiz View Helpers
// ============================================================================

/**
 * Calculate quiz progress percentage.
 */
export function calculateQuizProgress(
  quiz: Quiz,
  totalParticipants: number,
): number {
  if (totalParticipants === 0) return 0;
  return (quiz.responses.length / totalParticipants) * 100;
}

/**
 * Check if a participant has already responded to a quiz.
 */
export function hasParticipantResponded(
  quiz: Quiz,
  participantId: string,
): boolean {
  return quiz.responses.some((r) => r.participantId === participantId);
}

/**
 * Get the selected option for a participant.
 */
export function getParticipantResponse(
  quiz: Quiz,
  participantId: string,
): { selectedOptionId: string; submittedAt: string } | null {
  const response = quiz.responses.find((r) => r.participantId === participantId);
  if (!response) return null;
  return {
    selectedOptionId: response.selectedOptionId,
    submittedAt: response.submittedAt,
  };
}

// ============================================================================
// Attendance View Helpers
// ============================================================================

/**
 * Calculate total attendance duration in minutes.
 */
export function calculateTotalAttendanceDuration(
  records: ReadonlyArray<AttendanceRecord>,
): number {
  return records.reduce((total, record) => total + record.totalDurationMinutes, 0);
}

/**
 * Get active participants (those who haven't left).
 */
export function getActiveParticipants(
  records: ReadonlyArray<AttendanceRecord>,
): ReadonlyArray<AttendanceRecord> {
  return records.filter((record) => record.leftAt === null);
}

/**
 * Format attendance duration for display.
 */
export function formatAttendanceDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// ============================================================================
// Breakout Room View Helpers
// ============================================================================

/**
 * Get breakout room by participant ID.
 */
export function getBreakoutRoomForParticipant(
  rooms: ReadonlyArray<BreakoutRoom>,
  participantId: string,
): BreakoutRoom | null {
  return rooms.find((room) =>
    room.assignedParticipants.some((id) => id === participantId),
  ) ?? null;
}

/**
 * Calculate total participants in breakout rooms.
 */
export function getTotalParticipantsInBreakoutRooms(
  rooms: ReadonlyArray<BreakoutRoom>,
): number {
  return rooms.reduce(
    (total, room) => total + room.assignedParticipants.length,
    0,
  );
}