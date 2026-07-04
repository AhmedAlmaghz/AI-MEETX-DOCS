import 'reflect-metadata';

import { describe, it, expect, beforeEach, vi } from 'vitest';

import type {
  ClassroomSessionId,
  IsoDateString,
  MeetingId,
  ParticipantId,
  QuizId,
  UserId,
} from '@aimeetx/types';

import { InMemoryEventBus } from '@aimeetx/events';

import type {
  ClassroomSession,
  Quiz,
  AttendanceRecord,
} from '../model/classroom.js';
import type {
  ClassroomRepository,
  QuizRepository,
  AttendanceRepository,
} from '../port/classroom-repository.js';
import {
  CreateClassroomSessionUseCase,
  CreateQuizUseCase,
  SubmitQuizResponseUseCase,
  GradeQuizUseCase,
  CreateBreakoutRoomsUseCase,
  RecordAttendanceUseCase,
  ExportAttendanceReportUseCase,
} from './classroom-use-cases.js';

// ============================================================================
// Test Helpers
// ============================================================================

const makeClassroomSessionId = (): ClassroomSessionId =>
  'classroom_session_123' as ClassroomSessionId;
const makeMeetingId = (): MeetingId => 'meeting_123' as MeetingId;
const makeQuizId = (): QuizId => 'quiz_123' as QuizId;
const makeUserId = (): UserId => 'user_host' as UserId;
const makeParticipantId = (): ParticipantId => 'participant_123' as ParticipantId;
const makeIsoDate = (date: string): IsoDateString => date as IsoDateString;

function createMockClassroomSession(
  overrides: Partial<ClassroomSession> = {},
): ClassroomSession {
  return {
    id: makeClassroomSessionId(),
    meetingId: makeMeetingId(),
    status: 'active',
    allowStudentWhiteboard: false,
    breakoutRooms: [],
    createdAt: makeIsoDate('2025-01-15T10:00:00Z'),
    updatedAt: makeIsoDate('2025-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockQuiz(overrides: Partial<Quiz> = {}): Quiz {
  return {
    id: makeQuizId(),
    classroomSessionId: makeClassroomSessionId(),
    question: 'What is 2 + 2?',
    options: [
      { id: 'a', text: '3' },
      { id: 'b', text: '4' },
      { id: 'c', text: '5' },
    ],
    correctOptionId: 'b',
    showCorrectAnswer: false,
    status: 'draft',
    responses: [],
    createdAt: makeIsoDate('2025-01-15T10:00:00Z'),
    updatedAt: makeIsoDate('2025-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockAttendanceRecord(
  overrides: Partial<AttendanceRecord> = {},
): AttendanceRecord {
  return {
    id: 'attendance_123' as import('@aimeetx/types').AttendanceId,
    classroomSessionId: makeClassroomSessionId(),
    participantId: makeParticipantId(),
    joinedAt: makeIsoDate('2025-01-15T10:00:00Z'),
    leftAt: null,
    totalDurationMinutes: 0,
    ...overrides,
  };
}

// ============================================================================
// CreateClassroomSessionUseCase Tests
// ============================================================================

describe('CreateClassroomSessionUseCase', () => {
  let classroomRepository: ClassroomRepository;
  let useCase: CreateClassroomSessionUseCase;

  beforeEach(() => {
    classroomRepository = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getSessionByMeetingId: vi.fn(),
      updateSession: vi.fn(),
      endSession: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new CreateClassroomSessionUseCase(classroomRepository, eventBus);
  });

  it('should create a classroom session successfully', async () => {
    const mockSession = createMockClassroomSession();
    vi.mocked(classroomRepository.createSession).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockSession,
    });

    const result = await useCase.execute({
      input: { meetingId: makeMeetingId() },
      createdBy: makeUserId(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockSession);
    }
  });

  it('should fail if repository returns error', async () => {
    vi.mocked(classroomRepository.createSession).mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: new Error('Database error'),
    });

    const result = await useCase.execute({
      input: { meetingId: makeMeetingId() },
      createdBy: makeUserId(),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Database error');
    }
  });
});

// ============================================================================
// CreateQuizUseCase Tests
// ============================================================================

describe('CreateQuizUseCase', () => {
  let quizRepository: QuizRepository;
  let classroomRepository: ClassroomRepository;
  let useCase: CreateQuizUseCase;

  beforeEach(() => {
    quizRepository = {
      createQuiz: vi.fn(),
      getQuiz: vi.fn(),
      getActiveQuizBySessionId: vi.fn(),
      updateQuizStatus: vi.fn(),
      submitResponse: vi.fn(),
      getResults: vi.fn(),
      deleteQuiz: vi.fn(),
    };
    classroomRepository = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getSessionByMeetingId: vi.fn(),
      updateSession: vi.fn(),
      endSession: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new CreateQuizUseCase(
      quizRepository,
      classroomRepository,
      eventBus,
    );
  });

  it('should create a quiz successfully', async () => {
    const mockSession = createMockClassroomSession();
    const mockQuiz = createMockQuiz();

    vi.mocked(classroomRepository.getSession).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockSession,
    });
    vi.mocked(quizRepository.createQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });

    const result = await useCase.execute({
      classroomSessionId: makeClassroomSessionId(),
      instructorId: makeUserId(),
      question: 'What is 2 + 2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
      correctOptionId: 'b',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.question).toBe('What is 2 + 2?');
    }
  });

  it('should fail if question is empty', async () => {
    const result = await useCase.execute({
      classroomSessionId: makeClassroomSessionId(),
      instructorId: makeUserId(),
      question: '',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at least 1 character');
    }
  });

  it('should fail if less than 2 options', async () => {
    const result = await useCase.execute({
      classroomSessionId: makeClassroomSessionId(),
      instructorId: makeUserId(),
      question: 'What is 2 + 2?',
      options: [{ id: 'a', text: '4' }],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at least 2 options');
    }
  });

  it('should fail if classroom session not found', async () => {
    vi.mocked(classroomRepository.getSession).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: null,
    });

    const result = await useCase.execute({
      classroomSessionId: makeClassroomSessionId(),
      instructorId: makeUserId(),
      question: 'What is 2 + 2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Classroom session not found');
    }
  });

  it('should fail if classroom session has ended', async () => {
    const mockSession = createMockClassroomSession({ status: 'ended' });
    vi.mocked(classroomRepository.getSession).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockSession,
    });

    const result = await useCase.execute({
      classroomSessionId: makeClassroomSessionId(),
      instructorId: makeUserId(),
      question: 'What is 2 + 2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Classroom session has ended');
    }
  });

  it('should activate quiz immediately if requested', async () => {
    const mockSession = createMockClassroomSession();
    const draftQuiz = createMockQuiz({ status: 'draft' });
    const activeQuiz = createMockQuiz({ status: 'active' });

    vi.mocked(classroomRepository.getSession).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockSession,
    });
    vi.mocked(quizRepository.createQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: draftQuiz,
    });
    vi.mocked(quizRepository.updateQuizStatus).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: activeQuiz,
    });

    const result = await useCase.execute({
      classroomSessionId: makeClassroomSessionId(),
      instructorId: makeUserId(),
      question: 'What is 2 + 2?',
      options: [
        { id: 'a', text: '3' },
        { id: 'b', text: '4' },
      ],
      activateImmediately: true,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe('active');
    }
  });
});

// ============================================================================
// SubmitQuizResponseUseCase Tests
// ============================================================================

describe('SubmitQuizResponseUseCase', () => {
  let quizRepository: QuizRepository;
  let useCase: SubmitQuizResponseUseCase;

  beforeEach(() => {
    quizRepository = {
      createQuiz: vi.fn(),
      getQuiz: vi.fn(),
      getActiveQuizBySessionId: vi.fn(),
      updateQuizStatus: vi.fn(),
      submitResponse: vi.fn(),
      getResults: vi.fn(),
      deleteQuiz: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new SubmitQuizResponseUseCase(quizRepository, eventBus);
  });

  it('should submit quiz response successfully', async () => {
    const mockQuiz = createMockQuiz({ status: 'active' });
    const updatedQuiz = createMockQuiz({
      status: 'active',
      responses: [
        {
          participantId: makeParticipantId(),
          selectedOptionId: 'b',
          submittedAt: makeIsoDate('2025-01-15T10:05:00Z'),
        },
      ],
    });

    vi.mocked(quizRepository.getQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });
    vi.mocked(quizRepository.submitResponse).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: updatedQuiz,
    });
    vi.mocked(quizRepository.getResults).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: new Map([['b', 1]]),
    });

    const result = await useCase.execute({
      quizId: makeQuizId(),
      participantId: makeParticipantId(),
      selectedOptionId: 'b',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.responses).toHaveLength(1);
    }
  });

  it('should fail if quiz is not active', async () => {
    const mockQuiz = createMockQuiz({ status: 'draft' });
    vi.mocked(quizRepository.getQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });

    const result = await useCase.execute({
      quizId: makeQuizId(),
      participantId: makeParticipantId(),
      selectedOptionId: 'b',
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Quiz is not active');
    }
  });

  it('should fail if option is invalid', async () => {
    const mockQuiz = createMockQuiz({ status: 'active' });
    vi.mocked(quizRepository.getQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });

    const result = await useCase.execute({
      quizId: makeQuizId(),
      participantId: makeParticipantId(),
      selectedOptionId: 'invalid_option',
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Invalid option selected');
    }
  });

  it('should fail if participant already responded', async () => {
    const mockQuiz = createMockQuiz({
      status: 'active',
      responses: [
        {
          participantId: makeParticipantId(),
          selectedOptionId: 'a',
          submittedAt: makeIsoDate('2025-01-15T10:04:00Z'),
        },
      ],
    });
    vi.mocked(quizRepository.getQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });

    const result = await useCase.execute({
      quizId: makeQuizId(),
      participantId: makeParticipantId(),
      selectedOptionId: 'b',
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe(
        'Participant has already submitted a response',
      );
    }
  });
});

// ============================================================================
// GradeQuizUseCase Tests
// ============================================================================

describe('GradeQuizUseCase', () => {
  let quizRepository: QuizRepository;
  let useCase: GradeQuizUseCase;

  beforeEach(() => {
    quizRepository = {
      createQuiz: vi.fn(),
      getQuiz: vi.fn(),
      getActiveQuizBySessionId: vi.fn(),
      updateQuizStatus: vi.fn(),
      submitResponse: vi.fn(),
      getResults: vi.fn(),
      deleteQuiz: vi.fn(),
    };
    useCase = new GradeQuizUseCase(quizRepository);
  });

  it('should grade quiz successfully', async () => {
    const mockQuiz = createMockQuiz({
      status: 'closed',
      correctOptionId: 'b',
      responses: [
        {
          participantId: 'p1' as ParticipantId,
          selectedOptionId: 'b',
          submittedAt: makeIsoDate('2025-01-15T10:05:00Z'),
        },
        {
          participantId: 'p2' as ParticipantId,
          selectedOptionId: 'a',
          submittedAt: makeIsoDate('2025-01-15T10:05:30Z'),
        },
      ],
    });

    vi.mocked(quizRepository.getQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });
    vi.mocked(quizRepository.getResults).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: new Map([
        ['a', 1],
        ['b', 1],
      ]),
    });

    const result = await useCase.execute({ quizId: makeQuizId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.totalParticipants).toBe(2);
      expect(result.value.correctResponses).toBe(1);
      expect(result.value.accuracyPercentage).toBe(50);
    }
  });

  it('should fail if quiz has no correct answer', async () => {
    const mockQuiz = createMockQuiz({ correctOptionId: null });
    vi.mocked(quizRepository.getQuiz).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockQuiz,
    });

    const result = await useCase.execute({ quizId: makeQuizId() });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe(
        'Quiz does not have a correct answer defined',
      );
    }
  });
});

// ============================================================================
// CreateBreakoutRoomsUseCase Tests
// ============================================================================

describe('CreateBreakoutRoomsUseCase', () => {
  let classroomRepository: ClassroomRepository;
  let useCase: CreateBreakoutRoomsUseCase;

  beforeEach(() => {
    classroomRepository = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getSessionByMeetingId: vi.fn(),
      updateSession: vi.fn(),
      endSession: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new CreateBreakoutRoomsUseCase(
      classroomRepository,
      eventBus,
    );
  });

  it('should create breakout rooms successfully', async () => {
    const mockSession = createMockClassroomSession();
    const updatedSession = createMockClassroomSession({
      breakoutRooms: [
        {
          id: 'room_1' as import('@aimeetx/types').BreakoutRoomId,
          name: 'Room 1',
          livekitRoomName: `${makeMeetingId()}-breakout-1`,
          assignedParticipants: ['p1' as ParticipantId, 'p2' as ParticipantId],
        },
        {
          id: 'room_2' as import('@aimeetx/types').BreakoutRoomId,
          name: 'Room 2',
          livekitRoomName: `${makeMeetingId()}-breakout-2`,
          assignedParticipants: ['p3' as ParticipantId],
        },
      ],
    });

    vi.mocked(classroomRepository.getSessionByMeetingId).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockSession,
    });
    vi.mocked(classroomRepository.updateSession).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: updatedSession,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      hostId: makeUserId(),
      rooms: [
        {
          name: 'Room 1',
          assignedParticipants: ['p1' as ParticipantId, 'p2' as ParticipantId],
        },
        {
          name: 'Room 2',
          assignedParticipants: ['p3' as ParticipantId],
        },
      ],
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.breakoutRooms).toHaveLength(2);
    }
  });

  it('should fail if less than 2 rooms', async () => {
    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      hostId: makeUserId(),
      rooms: [{ name: 'Room 1', assignedParticipants: [] }],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at least 2 breakout rooms');
    }
  });

  it('should fail if classroom session not found', async () => {
    vi.mocked(classroomRepository.getSessionByMeetingId).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: null,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      hostId: makeUserId(),
      rooms: [
        { name: 'Room 1', assignedParticipants: [] },
        { name: 'Room 2', assignedParticipants: [] },
      ],
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe(
        'Classroom session not found for this meeting',
      );
    }
  });
});

// ============================================================================
// RecordAttendanceUseCase Tests
// ============================================================================

describe('RecordAttendanceUseCase', () => {
  let attendanceRepository: AttendanceRepository;
  let useCase: RecordAttendanceUseCase;

  beforeEach(() => {
    attendanceRepository = {
      recordJoin: vi.fn(),
      recordLeave: vi.fn(),
      getRecord: vi.fn(),
      getRecordsBySessionId: vi.fn(),
      getRecordByParticipantAndSession: vi.fn(),
      exportAttendanceReport: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new RecordAttendanceUseCase(attendanceRepository, eventBus);
  });

  it('should record attendance successfully', async () => {
    const mockRecord = createMockAttendanceRecord();
    vi.mocked(attendanceRepository.recordJoin).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockRecord,
    });

    const result = await useCase.execute({
      sessionId: makeClassroomSessionId(),
      participantId: makeParticipantId(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockRecord);
    }
  });
});

// ============================================================================
// ExportAttendanceReportUseCase Tests
// ============================================================================

describe('ExportAttendanceReportUseCase', () => {
  let attendanceRepository: AttendanceRepository;
  let useCase: ExportAttendanceReportUseCase;

  beforeEach(() => {
    attendanceRepository = {
      recordJoin: vi.fn(),
      recordLeave: vi.fn(),
      getRecord: vi.fn(),
      getRecordsBySessionId: vi.fn(),
      getRecordByParticipantAndSession: vi.fn(),
      exportAttendanceReport: vi.fn(),
    };
    useCase = new ExportAttendanceReportUseCase(attendanceRepository);
  });

  it('should export attendance report as CSV', async () => {
    const csvData = `Participant ID,Joined At,Left At,Duration (minutes)
participant_123,2025-01-15T10:00:00Z,,60`;

    vi.mocked(attendanceRepository.exportAttendanceReport).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: csvData,
    });

    const result = await useCase.execute({
      sessionId: makeClassroomSessionId(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toContain('Participant ID');
    }
  });
});