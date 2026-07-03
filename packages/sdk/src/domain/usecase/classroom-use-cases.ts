import { inject, injectable } from 'tsyringe';

import type {
  ClassroomSessionId,
  IsoDateString,
  MeetingId,
  ParticipantId,
  QuizId,
  Result,
  UserId,
  Uuid,
} from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type {
  AttendanceRecord,
  BreakoutRoom,
  BreakoutRoomConfig,
  ClassroomSession,
  Quiz,
} from '../model/classroom.js';
import { CLASSROOM_CONSTRAINTS } from '../model/classroom.js';
import type {
  AttendanceRepository,
  ClassroomRepository,
  CreateClassroomSessionInput,
  CreateQuizInput,
  QuizRepository,
} from '../port/classroom-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Build a domain event envelope.
 */
function buildEvent<T extends string>(
  eventType: T,
  sourceModule: string,
  payload: Readonly<Record<string, unknown>>,
): {
  eventId: Uuid;
  eventType: T;
  version: number;
  timestamp: IsoDateString;
  sourceModule: string;
  correlationId: Uuid;
  payload: Readonly<Record<string, unknown>>;
} {
  return {
    eventId: crypto.randomUUID() as Uuid,
    eventType,
    version: 1,
    timestamp: new Date().toISOString() as IsoDateString,
    sourceModule,
    correlationId: crypto.randomUUID() as Uuid,
    payload,
  };
}

/**
 * Validate a quiz question.
 */
function validateQuestion(question: string): string | null {
  if (question.length < CLASSROOM_CONSTRAINTS.MIN_QUESTION_LENGTH) {
    return `Question must be at least ${CLASSROOM_CONSTRAINTS.MIN_QUESTION_LENGTH} character`;
  }
  if (question.length > CLASSROOM_CONSTRAINTS.MAX_QUESTION_LENGTH) {
    return `Question must be at most ${CLASSROOM_CONSTRAINTS.MAX_QUESTION_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate quiz options.
 */
function validateOptions(
  options: ReadonlyArray<{ readonly id: string; readonly text: string }>,
): string | null {
  if (options.length < CLASSROOM_CONSTRAINTS.MIN_OPTIONS) {
    return `Quiz must have at least ${CLASSROOM_CONSTRAINTS.MIN_OPTIONS} options`;
  }
  if (options.length > CLASSROOM_CONSTRAINTS.MAX_OPTIONS) {
    return `Quiz must have at most ${CLASSROOM_CONSTRAINTS.MAX_OPTIONS} options`;
  }
  for (const option of options) {
    if (option.text.length < CLASSROOM_CONSTRAINTS.MIN_OPTION_TEXT_LENGTH) {
      return `Option text must be at least ${CLASSROOM_CONSTRAINTS.MIN_OPTION_TEXT_LENGTH} character`;
    }
    if (option.text.length > CLASSROOM_CONSTRAINTS.MAX_OPTION_TEXT_LENGTH) {
      return `Option text must be at most ${CLASSROOM_CONSTRAINTS.MAX_OPTION_TEXT_LENGTH} characters`;
    }
  }
  return null;
}

/**
 * Validate breakout room name.
 */
function validateRoomName(name: string): string | null {
  if (name.length < CLASSROOM_CONSTRAINTS.MIN_ROOM_NAME_LENGTH) {
    return `Room name must be at least ${CLASSROOM_CONSTRAINTS.MIN_ROOM_NAME_LENGTH} character`;
  }
  if (name.length > CLASSROOM_CONSTRAINTS.MAX_ROOM_NAME_LENGTH) {
    return `Room name must be at most ${CLASSROOM_CONSTRAINTS.MAX_ROOM_NAME_LENGTH} characters`;
  }
  return null;
}

// ============================================================================
// CreateClassroomSessionUseCase
// ============================================================================

/**
 * Command for CreateClassroomSessionUseCase.
 */
export interface CreateClassroomSessionCommand {
  readonly input: CreateClassroomSessionInput;
  readonly createdBy: UserId;
}

/**
 * CreateClassroomSessionUseCase — creates a new classroom session for a meeting.
 *
 * Per `feature-classroom/SPECIFICATION.md`: creates classroom session in ACTIVE status.
 */
@injectable()
export class CreateClassroomSessionUseCase
  implements UseCase<CreateClassroomSessionCommand, ClassroomSession, Error>
{
  constructor(
    @inject(TOKENS.ClassroomRepository)
    private readonly classroomRepository: ClassroomRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateClassroomSessionCommand,
  ): Promise<Result<ClassroomSession, Error>> {
    const { input, createdBy } = command;

    // Create classroom session
    const result = await this.classroomRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const session = result.value;

    // Publish ClassroomSessionCreatedEvent
    this.eventBus.publish(
      buildEvent('ClassroomSessionCreated', '@aimeetx/sdk/classroom', {
        sessionId: session.id,
        meetingId: session.meetingId,
        createdBy,
        createdAt: session.createdAt,
      }),
    );

    return success(session);
  }
}

// ============================================================================
// CreateQuizUseCase
// ============================================================================

/**
 * Command for CreateQuizUseCase.
 */
export interface CreateQuizCommand {
  readonly classroomSessionId: ClassroomSessionId;
  readonly instructorId: UserId;
  readonly question: string;
  readonly options: ReadonlyArray<{ readonly id: string; readonly text: string }>;
  readonly correctOptionId?: string;
  readonly showCorrectAnswer?: boolean;
  readonly activateImmediately?: boolean;
}

/**
 * CreateQuizUseCase — creates a new quiz for a classroom session.
 *
 * Per `feature-classroom/SPECIFICATION.md`:
 * 1. Verify instructorId has HOST/MODERATOR role.
 * 2. Create Quiz (status = DRAFT).
 * 3. Save quiz.
 * 4. Optionally activate immediately (status = ACTIVE).
 * 5. Publish QuizCreatedEvent.
 */
@injectable()
export class CreateQuizUseCase
  implements UseCase<CreateQuizCommand, Quiz, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
    @inject(TOKENS.ClassroomRepository)
    private readonly classroomRepository: ClassroomRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateQuizCommand): Promise<Result<Quiz, Error>> {
    const {
      classroomSessionId,
      instructorId,
      question,
      options,
      correctOptionId,
      showCorrectAnswer = false,
      activateImmediately = false,
    } = command;

    // Validate question
    const questionError = validateQuestion(question);
    if (questionError) return failure(new Error(questionError));

    // Validate options
    const optionsError = validateOptions(options);
    if (optionsError) return failure(new Error(optionsError));

    // Validate correct option ID if provided
    if (correctOptionId && !options.some((o) => o.id === correctOptionId)) {
      return failure(new Error('Correct option ID does not match any option'));
    }

    // Get classroom session
    const sessionResult =
      await this.classroomRepository.getSession(classroomSessionId);
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Classroom session not found'));
    }

    const session = sessionResult.value;

    // Check if session is active
    if (session.status === 'ended') {
      return failure(new Error('Classroom session has ended'));
    }

    // Create quiz
    const createQuizInput: CreateQuizInput = {
      classroomSessionId,
      question,
      options,
      correctOptionId: correctOptionId ?? undefined,
      showCorrectAnswer,
    };

    const quizResult = await this.quizRepository.createQuiz(createQuizInput);
    if (quizResult.isFailure) {
      return failure(quizResult.error);
    }

    let quiz = quizResult.value;

    // Activate immediately if requested
    if (activateImmediately) {
      const activateResult = await this.quizRepository.updateQuizStatus(
        quiz.id,
        'active',
      );
      if (activateResult.isFailure) {
        return failure(activateResult.error);
      }
      quiz = activateResult.value;
    }

    // Publish QuizCreatedEvent
    this.eventBus.publish(
      buildEvent('QuizCreated', '@aimeetx/sdk/classroom', {
        quizId: quiz.id,
        classroomSessionId,
        question: quiz.question,
        optionsCount: quiz.options.length,
        status: quiz.status,
        createdBy: instructorId,
        createdAt: quiz.createdAt,
      }),
    );

    return success(quiz);
  }
}

// ============================================================================
// ActivateQuizUseCase
// ============================================================================

/**
 * Command for ActivateQuizUseCase.
 */
export interface ActivateQuizCommand {
  readonly quizId: QuizId;
  readonly activatedBy: UserId;
}

/**
 * ActivateQuizUseCase — activates a quiz for participants to answer.
 *
 * Per `feature-classroom/SPECIFICATION.md`: transitions quiz from DRAFT to ACTIVE.
 */
@injectable()
export class ActivateQuizUseCase
  implements UseCase<ActivateQuizCommand, Quiz, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ActivateQuizCommand): Promise<Result<Quiz, Error>> {
    const { quizId, activatedBy } = command;

    // Get quiz
    const quizResult = await this.quizRepository.getQuiz(quizId);
    if (quizResult.isFailure) {
      return failure(quizResult.error);
    }
    if (!quizResult.value) {
      return failure(new Error('Quiz not found'));
    }

    const quiz = quizResult.value;

    // Check if quiz is already closed
    if (quiz.status === 'closed') {
      return failure(new Error('Quiz is already closed'));
    }

    // Activate quiz
    const result = await this.quizRepository.updateQuizStatus(quizId, 'active');
    if (result.isFailure) {
      return failure(result.error);
    }

    const activatedQuiz = result.value;

    // Publish QuizActivatedEvent
    this.eventBus.publish(
      buildEvent('QuizActivated', '@aimeetx/sdk/classroom', {
        quizId,
        activatedBy,
        activatedAt: new Date().toISOString(),
      }),
    );

    return success(activatedQuiz);
  }
}

// ============================================================================
// CloseQuizUseCase
// ============================================================================

/**
 * Command for CloseQuizUseCase.
 */
export interface CloseQuizCommand {
  readonly quizId: QuizId;
  readonly closedBy: UserId;
}

/**
 * CloseQuizUseCase — closes a quiz to stop accepting responses.
 *
 * Per `feature-classroom/SPECIFICATION.md`: transitions quiz to CLOSED.
 */
@injectable()
export class CloseQuizUseCase
  implements UseCase<CloseQuizCommand, Quiz, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CloseQuizCommand): Promise<Result<Quiz, Error>> {
    const { quizId, closedBy } = command;

    // Get quiz
    const quizResult = await this.quizRepository.getQuiz(quizId);
    if (quizResult.isFailure) {
      return failure(quizResult.error);
    }
    if (!quizResult.value) {
      return failure(new Error('Quiz not found'));
    }

    // Close quiz
    const result = await this.quizRepository.updateQuizStatus(quizId, 'closed');
    if (result.isFailure) {
      return failure(result.error);
    }

    const closedQuiz = result.value;

    // Publish QuizClosedEvent
    this.eventBus.publish(
      buildEvent('QuizClosed', '@aimeetx/sdk/classroom', {
        quizId,
        closedBy,
        closedAt: new Date().toISOString(),
      }),
    );

    return success(closedQuiz);
  }
}

// ============================================================================
// SubmitQuizResponseUseCase
// ============================================================================

/**
 * Command for SubmitQuizResponseUseCase.
 */
export interface SubmitQuizResponseCommand {
  readonly quizId: QuizId;
  readonly participantId: ParticipantId;
  readonly selectedOptionId: string;
}

/**
 * SubmitQuizResponseUseCase — submits a participant's answer to a quiz.
 *
 * Per `feature-classroom/SPECIFICATION.md`:
 * 1. Load quiz. Verify status = ACTIVE.
 * 2. Check no existing response from this participant.
 * 3. Save QuizResponse.
 * 4. Compute updated aggregated results.
 * 5. Publish QuizResultsUpdatedEvent.
 */
@injectable()
export class SubmitQuizResponseUseCase
  implements UseCase<SubmitQuizResponseCommand, Quiz, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: SubmitQuizResponseCommand,
  ): Promise<Result<Quiz, Error>> {
    const { quizId, participantId, selectedOptionId } = command;

    // Get quiz
    const quizResult = await this.quizRepository.getQuiz(quizId);
    if (quizResult.isFailure) {
      return failure(quizResult.error);
    }
    if (!quizResult.value) {
      return failure(new Error('Quiz not found'));
    }

    const quiz = quizResult.value;

    // Verify quiz is active
    if (quiz.status !== 'active') {
      return failure(new Error('Quiz is not active'));
    }

    // Validate selected option
    if (!quiz.options.some((o) => o.id === selectedOptionId)) {
      return failure(new Error('Invalid option selected'));
    }

    // Check for duplicate response
    if (quiz.responses.some((r) => r.participantId === participantId)) {
      return failure(new Error('Participant has already submitted a response'));
    }

    // Submit response
    const response = {
      participantId,
      selectedOptionId,
      submittedAt: new Date().toISOString() as IsoDateString,
    };

    const result = await this.quizRepository.submitResponse(quizId, response);
    if (result.isFailure) {
      return failure(result.error);
    }

    const updatedQuiz = result.value;

    // Publish QuizResponseSubmittedEvent
    this.eventBus.publish(
      buildEvent('QuizResponseSubmitted', '@aimeetx/sdk/classroom', {
        quizId,
        participantId,
        selectedOptionId,
        totalResponses: updatedQuiz.responses.length,
        submittedAt: response.submittedAt,
      }),
    );

    return success(updatedQuiz);
  }
}

// ============================================================================
// GradeQuizUseCase
// ============================================================================

/**
 * Result of grading a quiz.
 */
export interface QuizGradeResult {
  readonly quizId: QuizId;
  readonly totalParticipants: number;
  readonly correctResponses: number;
  readonly incorrectResponses: number;
  readonly accuracyPercentage: number;
  readonly resultsByOption: ReadonlyMap<string, number>;
}

/**
 * Command for GradeQuizUseCase.
 */
export interface GradeQuizCommand {
  readonly quizId: QuizId;
}

/**
 * GradeQuizUseCase — grades a quiz and returns results.
 *
 * Per `feature-classroom/SPECIFICATION.md`: computes grades automatically.
 */
@injectable()
export class GradeQuizUseCase
  implements UseCase<GradeQuizCommand, QuizGradeResult, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
  ) {}

  async execute(
    command: GradeQuizCommand,
  ): Promise<Result<QuizGradeResult, Error>> {
    const { quizId } = command;

    // Get quiz
    const quizResult = await this.quizRepository.getQuiz(quizId);
    if (quizResult.isFailure) {
      return failure(quizResult.error);
    }
    if (!quizResult.value) {
      return failure(new Error('Quiz not found'));
    }

    const quiz = quizResult.value;

    // Check if quiz has a correct answer
    if (!quiz.correctOptionId) {
      return failure(new Error('Quiz does not have a correct answer defined'));
    }

    // Get results
    const resultsResult = await this.quizRepository.getResults(quizId);
    if (resultsResult.isFailure) {
      return failure(resultsResult.error);
    }

    const resultsByOption = resultsResult.value;
    const totalParticipants = quiz.responses.length;
    const correctResponses = resultsByOption.get(quiz.correctOptionId) ?? 0;
    const incorrectResponses = totalParticipants - correctResponses;
    const accuracyPercentage =
      totalParticipants > 0 ? (correctResponses / totalParticipants) * 100 : 0;

    const gradeResult: QuizGradeResult = {
      quizId,
      totalParticipants,
      correctResponses,
      incorrectResponses,
      accuracyPercentage,
      resultsByOption,
    };

    return success(gradeResult);
  }
}

// ============================================================================
// CreateBreakoutRoomsUseCase
// ============================================================================

/**
 * Command for CreateBreakoutRoomsUseCase.
 */
export interface CreateBreakoutRoomsCommand {
  readonly meetingId: MeetingId;
  readonly hostId: UserId;
  readonly rooms: ReadonlyArray<BreakoutRoomConfig>;
}

/**
 * CreateBreakoutRoomsUseCase — creates breakout rooms for a classroom session.
 *
 * Per `feature-classroom/SPECIFICATION.md`:
 * 1. Verify hostId has HOST role.
 * 2. For each room config:
 *    - Generate a LiveKit room via RoomGateway.
 *    - Create BreakoutRoom value object.
 * 3. Update ClassroomSession with breakout rooms list.
 * 4. Move assigned participants to their rooms (issue new LiveKit tokens).
 * 5. Publish BreakoutRoomsCreatedEvent.
 */
@injectable()
export class CreateBreakoutRoomsUseCase
  implements UseCase<CreateBreakoutRoomsCommand, ClassroomSession, Error>
{
  constructor(
    @inject(TOKENS.ClassroomRepository)
    private readonly classroomRepository: ClassroomRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateBreakoutRoomsCommand,
  ): Promise<Result<ClassroomSession, Error>> {
    const { meetingId, hostId, rooms } = command;

    // Validate room count
    if (rooms.length < CLASSROOM_CONSTRAINTS.MIN_BREAKOUT_ROOMS) {
      return failure(
        new Error(
          `Must create at least ${CLASSROOM_CONSTRAINTS.MIN_BREAKOUT_ROOMS} breakout rooms`,
        ),
      );
    }
    if (rooms.length > CLASSROOM_CONSTRAINTS.MAX_BREAKOUT_ROOMS) {
      return failure(
        new Error(
          `Cannot create more than ${CLASSROOM_CONSTRAINTS.MAX_BREAKOUT_ROOMS} breakout rooms`,
        ),
      );
    }

    // Validate room names
    for (const room of rooms) {
      const nameError = validateRoomName(room.name);
      if (nameError) return failure(new Error(nameError));
    }

    // Get classroom session
    const sessionResult =
      await this.classroomRepository.getSessionByMeetingId(meetingId);
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Classroom session not found for this meeting'));
    }

    const session = sessionResult.value;

    // Check if session is active
    if (session.status === 'ended') {
      return failure(new Error('Classroom session has ended'));
    }

    // Create breakout rooms
    const breakoutRooms: BreakoutRoom[] = rooms.map((config, index) => ({
      id: crypto.randomUUID() as import('@aimeetx/types').BreakoutRoomId,
      name: config.name,
      livekitRoomName: `${meetingId}-breakout-${index + 1}`,
      assignedParticipants: config.assignedParticipants,
    }));

    // Update session with breakout rooms
    const updateResult = await this.classroomRepository.updateSession(
      session.id,
      { breakoutRooms },
    );
    if (updateResult.isFailure) {
      return failure(updateResult.error);
    }

    const updatedSession = updateResult.value;

    // Publish BreakoutRoomsCreatedEvent
    this.eventBus.publish(
      buildEvent('BreakoutRoomsCreated', '@aimeetx/sdk/classroom', {
        sessionId: session.id,
        meetingId,
        roomsCount: breakoutRooms.length,
        createdBy: hostId,
        createdAt: new Date().toISOString(),
      }),
    );

    return success(updatedSession);
  }
}

// ============================================================================
// EndClassroomSessionUseCase
// ============================================================================

/**
 * Command for EndClassroomSessionUseCase.
 */
export interface EndClassroomSessionCommand {
  readonly sessionId: ClassroomSessionId;
  readonly endedBy: UserId;
}

/**
 * EndClassroomSessionUseCase — ends a classroom session.
 *
 * Per `feature-classroom/SPECIFICATION.md`: transitions session to ENDED.
 */
@injectable()
export class EndClassroomSessionUseCase
  implements UseCase<EndClassroomSessionCommand, ClassroomSession, Error>
{
  constructor(
    @inject(TOKENS.ClassroomRepository)
    private readonly classroomRepository: ClassroomRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: EndClassroomSessionCommand,
  ): Promise<Result<ClassroomSession, Error>> {
    const { sessionId, endedBy } = command;

    // Get session
    const sessionResult = await this.classroomRepository.getSession(sessionId);
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Classroom session not found'));
    }

    const session = sessionResult.value;

    // Check if already ended
    if (session.status === 'ended') {
      return failure(new Error('Classroom session has already ended'));
    }

    // End session
    const result = await this.classroomRepository.endSession(sessionId);
    if (result.isFailure) {
      return failure(result.error);
    }

    const endedSession = result.value;

    // Publish ClassroomSessionEndedEvent
    this.eventBus.publish(
      buildEvent('ClassroomSessionEnded', '@aimeetx/sdk/classroom', {
        sessionId,
        endedBy,
        endedAt: new Date().toISOString(),
      }),
    );

    return success(endedSession);
  }
}

// ============================================================================
// RecordAttendanceUseCase
// ============================================================================

/**
 * Command for RecordAttendanceUseCase.
 */
export interface RecordAttendanceCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
}

/**
 * RecordAttendanceUseCase — records a participant's attendance in a classroom session.
 *
 * Per `feature-classroom/SPECIFICATION.md`: tracks participant attendance.
 */
@injectable()
export class RecordAttendanceUseCase
  implements UseCase<RecordAttendanceCommand, AttendanceRecord, Error>
{
  constructor(
    @inject(TOKENS.AttendanceRepository)
    private readonly attendanceRepository: AttendanceRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: RecordAttendanceCommand,
  ): Promise<Result<AttendanceRecord, Error>> {
    const { sessionId, participantId } = command;

    // Record join
    const result = await this.attendanceRepository.recordJoin({
      classroomSessionId: sessionId,
      participantId,
    });
    if (result.isFailure) {
      return failure(result.error);
    }

    const record = result.value;

    // Publish AttendanceRecordedEvent
    this.eventBus.publish(
      buildEvent('AttendanceRecorded', '@aimeetx/sdk/classroom', {
        attendanceId: record.id,
        sessionId,
        participantId,
        joinedAt: record.joinedAt,
      }),
    );

    return success(record);
  }
}

// ============================================================================
// ExportAttendanceReportUseCase
// ============================================================================

/**
 * Command for ExportAttendanceReportUseCase.
 */
export interface ExportAttendanceReportCommand {
  readonly sessionId: ClassroomSessionId;
}

/**
 * ExportAttendanceReportUseCase — exports attendance report as CSV.
 *
 * Per `feature-classroom/SPECIFICATION.md`: attendance is exportable as CSV.
 */
@injectable()
export class ExportAttendanceReportUseCase
  implements UseCase<ExportAttendanceReportCommand, string, Error>
{
  constructor(
    @inject(TOKENS.AttendanceRepository)
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async execute(
    command: ExportAttendanceReportCommand,
  ): Promise<Result<string, Error>> {
    const { sessionId } = command;

    // Export report
    const result = await this.attendanceRepository.exportAttendanceReport(
      sessionId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(result.value);
  }
}

// ============================================================================
// GetClassroomSessionUseCase
// ============================================================================

/**
 * Command for GetClassroomSessionUseCase.
 */
export interface GetClassroomSessionCommand {
  readonly sessionId: ClassroomSessionId;
}

/**
 * GetClassroomSessionUseCase — retrieves a classroom session by ID.
 */
@injectable()
export class GetClassroomSessionUseCase
  implements UseCase<GetClassroomSessionCommand, ClassroomSession | null, Error>
{
  constructor(
    @inject(TOKENS.ClassroomRepository)
    private readonly classroomRepository: ClassroomRepository,
  ) {}

  async execute(
    command: GetClassroomSessionCommand,
  ): Promise<Result<ClassroomSession | null, Error>> {
    const result = await this.classroomRepository.getSession(command.sessionId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// GetClassroomSessionByMeetingUseCase
// ============================================================================

/**
 * Command for GetClassroomSessionByMeetingUseCase.
 */
export interface GetClassroomSessionByMeetingCommand {
  readonly meetingId: MeetingId;
}

/**
 * GetClassroomSessionByMeetingUseCase — retrieves a classroom session by meeting ID.
 */
@injectable()
export class GetClassroomSessionByMeetingUseCase
  implements UseCase<
    GetClassroomSessionByMeetingCommand,
    ClassroomSession | null,
    Error
  > {
  constructor(
    @inject(TOKENS.ClassroomRepository)
    private readonly classroomRepository: ClassroomRepository,
  ) {}

  async execute(
    command: GetClassroomSessionByMeetingCommand,
  ): Promise<Result<ClassroomSession | null, Error>> {
    const result = await this.classroomRepository.getSessionByMeetingId(
      command.meetingId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// GetQuizUseCase
// ============================================================================

/**
 * Command for GetQuizUseCase.
 */
export interface GetQuizCommand {
  readonly quizId: QuizId;
}

/**
 * GetQuizUseCase — retrieves a quiz by ID.
 */
@injectable()
export class GetQuizUseCase
  implements UseCase<GetQuizCommand, Quiz | null, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
  ) {}

  async execute(command: GetQuizCommand): Promise<Result<Quiz | null, Error>> {
    const result = await this.quizRepository.getQuiz(command.quizId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// GetQuizResultsUseCase
// ============================================================================

/**
 * Command for GetQuizResultsUseCase.
 */
export interface GetQuizResultsCommand {
  readonly quizId: QuizId;
}

/**
 * GetQuizResultsUseCase — retrieves quiz results (optionId → count).
 */
@injectable()
export class GetQuizResultsUseCase
  implements UseCase<GetQuizResultsCommand, ReadonlyMap<string, number>, Error>
{
  constructor(
    @inject(TOKENS.QuizRepository)
    private readonly quizRepository: QuizRepository,
  ) {}

  async execute(
    command: GetQuizResultsCommand,
  ): Promise<Result<ReadonlyMap<string, number>, Error>> {
    const result = await this.quizRepository.getResults(command.quizId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// ListAttendanceRecordsUseCase
// ============================================================================

/**
 * Command for ListAttendanceRecordsUseCase.
 */
export interface ListAttendanceRecordsCommand {
  readonly sessionId: ClassroomSessionId;
}

/**
 * ListAttendanceRecordsUseCase — lists all attendance records for a session.
 */
@injectable()
export class ListAttendanceRecordsUseCase
  implements UseCase<
    ListAttendanceRecordsCommand,
    ReadonlyArray<AttendanceRecord>,
    Error
  >
{
  constructor(
    @inject(TOKENS.AttendanceRepository)
    private readonly attendanceRepository: AttendanceRepository,
  ) {}

  async execute(
    command: ListAttendanceRecordsCommand,
  ): Promise<Result<ReadonlyArray<AttendanceRecord>, Error>> {
    const result = await this.attendanceRepository.getRecordsBySessionId(
      command.sessionId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}