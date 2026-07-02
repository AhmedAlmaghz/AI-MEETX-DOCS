import 'reflect-metadata';

import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { IsoDateString, MeetingId, ParticipantId, UserId } from '@aimeetx/types';

import { InMemoryEventBus } from '@aimeetx/events';

import type {
  Meeting,
  Participant,
  ParticipantRole,
} from '../model/meeting.js';
import { DEFAULT_MEETING_SETTINGS } from '../model/meeting.js';
import type {
  MeetingRepository,
  ParticipantRepository,
} from '../port/meeting-repository.js';
import {
  CreateMeetingUseCase,
  GetMeetingUseCase,
  StartMeetingUseCase,
  EndMeetingUseCase,
  JoinMeetingUseCase,
  LeaveMeetingUseCase,
  MuteParticipantUseCase,
  RaiseHandUseCase,
  ListParticipantsUseCase,
  ListMeetingsUseCase,
} from './meeting-use-cases.js';

// ============================================================================
// Test Helpers
// ============================================================================

const makeMeetingId = (): MeetingId => 'meeting_123' as MeetingId;
const makeUserId = (): UserId => 'user_host' as UserId;
const makeParticipantId = (): ParticipantId => 'participant_123' as ParticipantId;
const makeIsoDate = (date: string): IsoDateString => date as IsoDateString;

function createMockMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: makeMeetingId(),
    title: 'Test Meeting',
    description: null,
    hostId: makeUserId(),
    status: 'scheduled',
    passcode: null,
    maxParticipants: 100,
    settings: DEFAULT_MEETING_SETTINGS,
    livekitRoomName: null,
    startedAt: null,
    endedAt: null,
    createdAt: makeIsoDate('2025-01-15T10:00:00Z'),
    updatedAt: makeIsoDate('2025-01-15T10:00:00Z'),
    ...overrides,
  };
}

function createMockParticipant(overrides: Partial<Participant> = {}): Participant {
  return {
    id: makeParticipantId(),
    meetingId: makeMeetingId(),
    userId: 'user_123' as UserId,
    displayName: 'Test User',
    role: 'attendee',
    status: 'active',
    isMuted: false,
    isVideoOn: true,
    isScreenSharing: false,
    isHandRaised: false,
    joinedAt: makeIsoDate('2025-01-15T10:00:00Z'),
    leftAt: null,
    ...overrides,
  };
}

// ============================================================================
// CreateMeetingUseCase Tests
// ============================================================================

describe('CreateMeetingUseCase', () => {
  let meetingRepository: MeetingRepository;
  let useCase: CreateMeetingUseCase;

  beforeEach(() => {
    meetingRepository = {
      createMeeting: vi.fn(),
      getMeeting: vi.fn(),
      updateMeeting: vi.fn(),
      updateMeetingStatus: vi.fn(),
      startMeeting: vi.fn(),
      endMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
      listMeetingsByHost: vi.fn(),
      listActiveMeetings: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new CreateMeetingUseCase(meetingRepository, eventBus);
  });

  it('should create a meeting successfully', async () => {
    const mockMeeting = createMockMeeting();
    vi.mocked(meetingRepository.createMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });

    const result = await useCase.execute({
      input: {
        title: 'Test Meeting',
        hostId: makeUserId(),
      },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockMeeting);
    }
  });

  it('should fail if title is empty', async () => {
    const result = await useCase.execute({
      input: {
        title: '',
        hostId: makeUserId(),
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at least 1 character');
    }
  });

  it('should fail if title is too long', async () => {
    const result = await useCase.execute({
      input: {
        title: 'a'.repeat(257),
        hostId: makeUserId(),
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at most 256 characters');
    }
  });

  it('should fail if max participants exceeds limit', async () => {
    const result = await useCase.execute({
      input: {
        title: 'Test Meeting',
        hostId: makeUserId(),
        maxParticipants: 501,
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('cannot exceed 500');
    }
  });

  it('should fail if repository returns error', async () => {
    vi.mocked(meetingRepository.createMeeting).mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: new Error('Database error'),
    });

    const result = await useCase.execute({
      input: {
        title: 'Test Meeting',
        hostId: makeUserId(),
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Database error');
    }
  });
});

// ============================================================================
// GetMeetingUseCase Tests
// ============================================================================

describe('GetMeetingUseCase', () => {
  let meetingRepository: MeetingRepository;
  let useCase: GetMeetingUseCase;

  beforeEach(() => {
    meetingRepository = {
      createMeeting: vi.fn(),
      getMeeting: vi.fn(),
      updateMeeting: vi.fn(),
      updateMeetingStatus: vi.fn(),
      startMeeting: vi.fn(),
      endMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
      listMeetingsByHost: vi.fn(),
      listActiveMeetings: vi.fn(),
    };
    useCase = new GetMeetingUseCase(meetingRepository);
  });

  it('should return meeting when found', async () => {
    const mockMeeting = createMockMeeting();
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });

    const result = await useCase.execute({ meetingId: makeMeetingId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockMeeting);
    }
  });

  it('should return null when meeting not found', async () => {
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: null,
    });

    const result = await useCase.execute({ meetingId: makeMeetingId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toBeNull();
    }
  });

  it('should fail on repository error', async () => {
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: false,
      isFailure: true,
      error: new Error('Database error'),
    });

    const result = await useCase.execute({ meetingId: makeMeetingId() });

    expect(result.isFailure).toBe(true);
  });
});

// ============================================================================
// StartMeetingUseCase Tests
// ============================================================================

describe('StartMeetingUseCase', () => {
  let meetingRepository: MeetingRepository;
  let useCase: StartMeetingUseCase;

  beforeEach(() => {
    meetingRepository = {
      createMeeting: vi.fn(),
      getMeeting: vi.fn(),
      updateMeeting: vi.fn(),
      updateMeetingStatus: vi.fn(),
      startMeeting: vi.fn(),
      endMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
      listMeetingsByHost: vi.fn(),
      listActiveMeetings: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new StartMeetingUseCase(meetingRepository, eventBus);
  });

  it('should start meeting successfully when host starts', async () => {
    const mockMeeting = createMockMeeting({ status: 'scheduled' });
    const startedMeeting = createMockMeeting({
      status: 'active',
      startedAt: makeIsoDate('2025-01-15T10:05:00Z'),
    });
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });
    vi.mocked(meetingRepository.startMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: startedMeeting,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      startedBy: makeUserId(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe('active');
    }
  });

  it('should fail if non-host tries to start', async () => {
    const mockMeeting = createMockMeeting();
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      startedBy: 'user_other' as UserId,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Only the host can start the meeting');
    }
  });

  it('should fail if meeting already ended', async () => {
    const mockMeeting = createMockMeeting({ status: 'ended' });
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      startedBy: makeUserId(),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Meeting has already ended');
    }
  });

  it('should fail if meeting not found', async () => {
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: null,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      startedBy: makeUserId(),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Meeting not found');
    }
  });
});

// ============================================================================
// EndMeetingUseCase Tests
// ============================================================================

describe('EndMeetingUseCase', () => {
  let meetingRepository: MeetingRepository;
  let participantRepository: ParticipantRepository;
  let useCase: EndMeetingUseCase;

  beforeEach(() => {
    meetingRepository = {
      createMeeting: vi.fn(),
      getMeeting: vi.fn(),
      updateMeeting: vi.fn(),
      updateMeetingStatus: vi.fn(),
      startMeeting: vi.fn(),
      endMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
      listMeetingsByHost: vi.fn(),
      listActiveMeetings: vi.fn(),
    };
    participantRepository = {
      joinMeeting: vi.fn(),
      getParticipant: vi.fn(),
      getParticipantByMeetingAndUser: vi.fn(),
      listParticipants: vi.fn(),
      listParticipantsByStatus: vi.fn(),
      updateParticipantStatus: vi.fn(),
      updateParticipantRole: vi.fn(),
      muteParticipant: vi.fn(),
      updateParticipantVideo: vi.fn(),
      updateParticipantScreenShare: vi.fn(),
      updateParticipantHandRaised: vi.fn(),
      removeParticipant: vi.fn(),
      removeAllParticipants: vi.fn(),
      countActiveParticipants: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new EndMeetingUseCase(meetingRepository, participantRepository, eventBus);
  });

  it('should end meeting successfully when host ends', async () => {
    const mockMeeting = createMockMeeting({ status: 'active' });
    const endedMeeting = createMockMeeting({
      status: 'ended',
      endedAt: makeIsoDate('2025-01-15T11:00:00Z'),
    });
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });
    vi.mocked(meetingRepository.endMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: endedMeeting,
    });
    vi.mocked(participantRepository.removeAllParticipants).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: undefined,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      endedBy: makeUserId(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe('ended');
    }
    expect(participantRepository.removeAllParticipants).toHaveBeenCalledWith(makeMeetingId());
  });

  it('should fail if non-host tries to end', async () => {
    const mockMeeting = createMockMeeting({ status: 'active' });
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });

    const result = await useCase.execute({
      meetingId: makeMeetingId(),
      endedBy: 'user_other' as UserId,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Only the host can end the meeting');
    }
  });
});

// ============================================================================
// JoinMeetingUseCase Tests
// ============================================================================

describe('JoinMeetingUseCase', () => {
  let meetingRepository: MeetingRepository;
  let participantRepository: ParticipantRepository;
  let useCase: JoinMeetingUseCase;

  beforeEach(() => {
    meetingRepository = {
      createMeeting: vi.fn(),
      getMeeting: vi.fn(),
      updateMeeting: vi.fn(),
      updateMeetingStatus: vi.fn(),
      startMeeting: vi.fn(),
      endMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
      listMeetingsByHost: vi.fn(),
      listActiveMeetings: vi.fn(),
    };
    participantRepository = {
      joinMeeting: vi.fn(),
      getParticipant: vi.fn(),
      getParticipantByMeetingAndUser: vi.fn(),
      listParticipants: vi.fn(),
      listParticipantsByStatus: vi.fn(),
      updateParticipantStatus: vi.fn(),
      updateParticipantRole: vi.fn(),
      muteParticipant: vi.fn(),
      updateParticipantVideo: vi.fn(),
      updateParticipantScreenShare: vi.fn(),
      updateParticipantHandRaised: vi.fn(),
      removeParticipant: vi.fn(),
      removeAllParticipants: vi.fn(),
      countActiveParticipants: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new JoinMeetingUseCase(meetingRepository, participantRepository, eventBus);
  });

  it('should join meeting successfully', async () => {
    const mockMeeting = createMockMeeting({ status: 'active' });
    const mockParticipant = createMockParticipant();
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });
    vi.mocked(participantRepository.countActiveParticipants).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: 5,
    });
    vi.mocked(participantRepository.joinMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockParticipant,
    });

    const result = await useCase.execute({
      input: {
        meetingId: makeMeetingId(),
        userId: 'user_123' as UserId,
        displayName: 'Test User',
      },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toEqual(mockParticipant);
    }
  });

  it('should fail if display name is empty', async () => {
    const result = await useCase.execute({
      input: {
        meetingId: makeMeetingId(),
        userId: 'user_123' as UserId,
        displayName: '',
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at least 1 character');
    }
  });

  it('should fail if meeting has ended', async () => {
    const mockMeeting = createMockMeeting({ status: 'ended' });
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });

    const result = await useCase.execute({
      input: {
        meetingId: makeMeetingId(),
        userId: 'user_123' as UserId,
        displayName: 'Test User',
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Meeting has already ended');
    }
  });

  it('should fail if meeting is at capacity', async () => {
    const mockMeeting = createMockMeeting({ status: 'active', maxParticipants: 10 });
    vi.mocked(meetingRepository.getMeeting).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeeting,
    });
    vi.mocked(participantRepository.countActiveParticipants).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: 10,
    });

    const result = await useCase.execute({
      input: {
        meetingId: makeMeetingId(),
        userId: 'user_123' as UserId,
        displayName: 'Test User',
      },
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toContain('at capacity');
    }
  });
});

// ============================================================================
// MuteParticipantUseCase Tests
// ============================================================================

describe('MuteParticipantUseCase', () => {
  let participantRepository: ParticipantRepository;
  let useCase: MuteParticipantUseCase;

  beforeEach(() => {
    participantRepository = {
      joinMeeting: vi.fn(),
      getParticipant: vi.fn(),
      getParticipantByMeetingAndUser: vi.fn(),
      listParticipants: vi.fn(),
      listParticipantsByStatus: vi.fn(),
      updateParticipantStatus: vi.fn(),
      updateParticipantRole: vi.fn(),
      muteParticipant: vi.fn(),
      updateParticipantVideo: vi.fn(),
      updateParticipantScreenShare: vi.fn(),
      updateParticipantHandRaised: vi.fn(),
      removeParticipant: vi.fn(),
      removeAllParticipants: vi.fn(),
      countActiveParticipants: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new MuteParticipantUseCase(participantRepository, eventBus);
  });

  it('should allow participant to mute themselves', async () => {
    const mockParticipant = createMockParticipant({ isMuted: false });
    const mutedParticipant = createMockParticipant({ isMuted: true });
    vi.mocked(participantRepository.getParticipant).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockParticipant,
    });
    vi.mocked(participantRepository.muteParticipant).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mutedParticipant,
    });

    const result = await useCase.execute({
      participantId: makeParticipantId(),
      muted: true,
      mutedBy: makeParticipantId(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.isMuted).toBe(true);
    }
  });

  it('should allow host to mute others', async () => {
    const targetParticipant = createMockParticipant({ id: 'participant_target' as ParticipantId, isMuted: false });
    const hostParticipant = createMockParticipant({
      id: 'participant_host' as ParticipantId,
      role: 'host' as ParticipantRole,
    });
    const mutedParticipant = createMockParticipant({ id: 'participant_target' as ParticipantId, isMuted: true });

    vi.mocked(participantRepository.getParticipant)
      .mockResolvedValueOnce({ isSuccess: true, isFailure: false, value: targetParticipant })
      .mockResolvedValueOnce({ isSuccess: true, isFailure: false, value: hostParticipant });
    vi.mocked(participantRepository.muteParticipant).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mutedParticipant,
    });

    const result = await useCase.execute({
      participantId: 'participant_target' as ParticipantId,
      muted: true,
      mutedBy: 'participant_host' as ParticipantId,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.isMuted).toBe(true);
    }
  });

  it('should fail if attendee tries to mute others', async () => {
    const targetParticipant = createMockParticipant({ id: 'participant_target' as ParticipantId });
    const attendeeParticipant = createMockParticipant({
      id: 'participant_attendee' as ParticipantId,
      role: 'attendee' as ParticipantRole,
    });

    vi.mocked(participantRepository.getParticipant)
      .mockResolvedValueOnce({ isSuccess: true, isFailure: false, value: targetParticipant })
      .mockResolvedValueOnce({ isSuccess: true, isFailure: false, value: attendeeParticipant });

    const result = await useCase.execute({
      participantId: 'participant_target' as ParticipantId,
      muted: true,
      mutedBy: 'participant_attendee' as ParticipantId,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Insufficient role to mute others');
    }
  });
});

// ============================================================================
// RaiseHandUseCase Tests
// ============================================================================

describe('RaiseHandUseCase', () => {
  let participantRepository: ParticipantRepository;
  let useCase: RaiseHandUseCase;

  beforeEach(() => {
    participantRepository = {
      joinMeeting: vi.fn(),
      getParticipant: vi.fn(),
      getParticipantByMeetingAndUser: vi.fn(),
      listParticipants: vi.fn(),
      listParticipantsByStatus: vi.fn(),
      updateParticipantStatus: vi.fn(),
      updateParticipantRole: vi.fn(),
      muteParticipant: vi.fn(),
      updateParticipantVideo: vi.fn(),
      updateParticipantScreenShare: vi.fn(),
      updateParticipantHandRaised: vi.fn(),
      removeParticipant: vi.fn(),
      removeAllParticipants: vi.fn(),
      countActiveParticipants: vi.fn(),
    };
    const eventBus = new InMemoryEventBus();
    useCase = new RaiseHandUseCase(participantRepository, eventBus);
  });

  it('should raise hand successfully', async () => {
    const mockParticipant = createMockParticipant({ isHandRaised: false });
    const raisedParticipant = createMockParticipant({ isHandRaised: true });
    vi.mocked(participantRepository.getParticipant).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockParticipant,
    });
    vi.mocked(participantRepository.updateParticipantHandRaised).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: raisedParticipant,
    });

    const result = await useCase.execute({ participantId: makeParticipantId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.isHandRaised).toBe(true);
    }
  });

  it('should fail if participant not found', async () => {
    vi.mocked(participantRepository.getParticipant).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: null,
    });

    const result = await useCase.execute({ participantId: makeParticipantId() });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.message).toBe('Participant not found');
    }
  });
});

// ============================================================================
// ListParticipantsUseCase Tests
// ============================================================================

describe('ListParticipantsUseCase', () => {
  let participantRepository: ParticipantRepository;
  let useCase: ListParticipantsUseCase;

  beforeEach(() => {
    participantRepository = {
      joinMeeting: vi.fn(),
      getParticipant: vi.fn(),
      getParticipantByMeetingAndUser: vi.fn(),
      listParticipants: vi.fn(),
      listParticipantsByStatus: vi.fn(),
      updateParticipantStatus: vi.fn(),
      updateParticipantRole: vi.fn(),
      muteParticipant: vi.fn(),
      updateParticipantVideo: vi.fn(),
      updateParticipantScreenShare: vi.fn(),
      updateParticipantHandRaised: vi.fn(),
      removeParticipant: vi.fn(),
      removeAllParticipants: vi.fn(),
      countActiveParticipants: vi.fn(),
    };
    useCase = new ListParticipantsUseCase(participantRepository);
  });

  it('should list all participants', async () => {
    const mockParticipants = [
      createMockParticipant({ id: 'p1' as ParticipantId, displayName: 'User 1' }),
      createMockParticipant({ id: 'p2' as ParticipantId, displayName: 'User 2' }),
    ];
    vi.mocked(participantRepository.listParticipants).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockParticipants,
    });

    const result = await useCase.execute({ meetingId: makeMeetingId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toHaveLength(2);
    }
  });

  it('should return empty array when no participants', async () => {
    vi.mocked(participantRepository.listParticipants).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: [],
    });

    const result = await useCase.execute({ meetingId: makeMeetingId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toHaveLength(0);
    }
  });
});

// ============================================================================
// ListMeetingsUseCase Tests
// ============================================================================

describe('ListMeetingsUseCase', () => {
  let meetingRepository: MeetingRepository;
  let useCase: ListMeetingsUseCase;

  beforeEach(() => {
    meetingRepository = {
      createMeeting: vi.fn(),
      getMeeting: vi.fn(),
      updateMeeting: vi.fn(),
      updateMeetingStatus: vi.fn(),
      startMeeting: vi.fn(),
      endMeeting: vi.fn(),
      deleteMeeting: vi.fn(),
      listMeetingsByHost: vi.fn(),
      listActiveMeetings: vi.fn(),
    };
    useCase = new ListMeetingsUseCase(meetingRepository);
  });

  it('should list all meetings for host', async () => {
    const mockMeetings = [
      createMockMeeting({ id: 'm1' as MeetingId, title: 'Meeting 1' }),
      createMockMeeting({ id: 'm2' as MeetingId, title: 'Meeting 2' }),
    ];
    vi.mocked(meetingRepository.listMeetingsByHost).mockResolvedValue({
      isSuccess: true,
      isFailure: false,
      value: mockMeetings,
    });

    const result = await useCase.execute({ hostId: makeUserId() });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toHaveLength(2);
    }
  });
});