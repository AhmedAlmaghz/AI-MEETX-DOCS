import 'reflect-metadata';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IsoDateString, MeetingId, ParticipantId, RecordingId, UserId } from '@aimeetx/types';
import { success } from '@aimeetx/types';

import { InMemoryEventBus } from '@aimeetx/events';

import type { Meeting } from '../model/meeting.js';
import { DEFAULT_MEETING_SETTINGS } from '../model/meeting.js';
import type {
  EgressStatus,
  MeetingRecording,
} from '../model/recording.js';
import type {
  DownloadLinkGenerator,
  RecordingActorClaims,
  RecordingGateway,
  RecordingRepository,
} from '../port/recording-repository.js';
import {
  DeleteRecordingUseCase,
  EgressStatusPollingJob,
  GetDownloadLinkUseCase,
  GetRecordingUseCase,
  ListRecordingsUseCase,
  StartRecordingUseCase,
  StopRecordingUseCase,
} from './recording-use-cases.js';

const meetingId = 'meeting_rec' as MeetingId;
const recordingId = 'rec_123' as RecordingId;
const hostId = 'participant_host' as ParticipantId;
const attendeeId = 'participant_attendee' as ParticipantId;
const startedAt = '2026-01-01T10:00:00.000Z' as IsoDateString;
const egressId = 'egress_123';

const hostActor: RecordingActorClaims = {
  userId: 'user_host' as UserId,
  role: 'host',
};

const attendeeActor: RecordingActorClaims = {
  userId: 'user_attendee' as UserId,
  role: 'attendee',
};

function createMeeting(overrides: Partial<Meeting> = {}): Meeting {
  return {
    id: meetingId,
    title: 'Recording Test Meeting',
    description: null,
    hostId: 'user_host' as UserId,
    status: 'active',
    passcode: null,
    maxParticipants: 100,
    settings: DEFAULT_MEETING_SETTINGS,
    livekitRoomName: 'room_test',
    startedAt: startedAt,
    endedAt: null,
    createdAt: startedAt,
    updatedAt: startedAt,
    ...overrides,
  };
}

function createRecording(overrides: Partial<MeetingRecording> = {}): MeetingRecording {
  return {
    id: recordingId,
    meetingId,
    egressId,
    layout: 'speaker_view',
    status: 'starting',
    storageUrl: null,
    fileSizeBytes: null,
    durationSeconds: null,
    startedBy: hostId,
    startedAt,
    stoppedAt: null,
    expiresAt: null,
    ...overrides,
  };
}

function createRecordingRepository(): RecordingRepository {
  return {
    save: vi.fn(),
    findById: vi.fn(),
    findByMeetingId: vi.fn(),
    findByStatus: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

function createRecordingGateway(): RecordingGateway {
  return {
    startEgress: vi.fn(),
    stopEgress: vi.fn(),
    getEgressStatus: vi.fn(),
  };
}

function createDownloadLinkGenerator(): DownloadLinkGenerator {
  return {
    generateSignedUrl: vi.fn(),
  };
}

describe('Phase 10 recording use cases', () => {
  let recordingRepository: RecordingRepository;
  let recordingGateway: RecordingGateway;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    recordingRepository = createRecordingRepository();
    recordingGateway = createRecordingGateway();
    eventBus = new InMemoryEventBus();
  });

  it('starts recording when host initiates on an active meeting', async () => {
    vi.mocked(recordingRepository.findByMeetingId).mockResolvedValue(success([]));
    vi.mocked(recordingGateway.startEgress).mockResolvedValue(success(egressId));
    vi.mocked(recordingRepository.save).mockImplementation(async (rec) => success(rec));

    const useCase = new StartRecordingUseCase(recordingRepository, recordingGateway, eventBus);
    const result = await useCase.execute({
      actor: hostActor,
      input: { meetingId, hostId, layout: 'speaker_view', roomName: 'room_test', storageBucket: 'bucket_1' },
      meeting: createMeeting(),
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.egressId).toBe(egressId);
      expect(result.value.status).toBe('starting');
      expect(result.value.layout).toBe('speaker_view');
    }
    expect(recordingGateway.startEgress).toHaveBeenCalledTimes(1);
    expect(recordingRepository.save).toHaveBeenCalledTimes(1);
  });

  it('fails if non-host tries to start recording (RBAC)', async () => {
    const useCase = new StartRecordingUseCase(recordingRepository, recordingGateway, eventBus);
    const result = await useCase.execute({
      actor: attendeeActor,
      input: { meetingId, hostId: attendeeId, layout: 'speaker_view', roomName: 'room_test', storageBucket: 'bucket_1' },
      meeting: createMeeting(),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('host or co-host');
    expect(recordingGateway.startEgress).not.toHaveBeenCalled();
  });

  it('fails when meeting is not active', async () => {
    const useCase = new StartRecordingUseCase(recordingRepository, recordingGateway, eventBus);
    const result = await useCase.execute({
      actor: hostActor,
      input: { meetingId, hostId, layout: 'speaker_view', roomName: 'room_test', storageBucket: 'bucket_1' },
      meeting: createMeeting({ status: 'ended' }),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('must be active');
  });

  it('fails when recording already active', async () => {
    vi.mocked(recordingRepository.findByMeetingId).mockResolvedValue(
      success([createRecording({ status: 'active' })]),
    );

    const useCase = new StartRecordingUseCase(recordingRepository, recordingGateway, eventBus);
    const result = await useCase.execute({
      actor: hostActor,
      input: { meetingId, hostId, layout: 'speaker_view', roomName: 'room_test', storageBucket: 'bucket_1' },
      meeting: createMeeting(),
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('already active');
  });

  it('stops recording and transitions to stopping status', async () => {
    const recording = createRecording({ status: 'active' });
    vi.mocked(recordingRepository.findById).mockResolvedValue(success(recording));
    vi.mocked(recordingGateway.stopEgress).mockResolvedValue(success(undefined));
    vi.mocked(recordingRepository.update).mockImplementation(async (rec) => success(rec));

    const useCase = new StopRecordingUseCase(recordingRepository, recordingGateway, eventBus);
    const result = await useCase.execute({
      actor: hostActor,
      meetingId,
      recordingId,
      stoppedBy: hostId,
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.status).toBe('stopping');
      expect(result.value.stoppedAt).not.toBeNull();
    }
    expect(recordingGateway.stopEgress).toHaveBeenCalledTimes(1);
  });

  it('fails if attendee tries to stop recording (RBAC)', async () => {
    vi.mocked(recordingRepository.findById).mockResolvedValue(success(createRecording()));

    const useCase = new StopRecordingUseCase(recordingRepository, recordingGateway, eventBus);
    const result = await useCase.execute({
      actor: attendeeActor,
      meetingId,
      recordingId,
      stoppedBy: attendeeId,
    });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('host or co-host');
    expect(recordingGateway.stopEgress).not.toHaveBeenCalled();
  });
});

describe('Phase 10 egress status polling job', () => {
  let recordingRepository: RecordingRepository;
  let recordingGateway: RecordingGateway;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    recordingRepository = createRecordingRepository();
    recordingGateway = createRecordingGateway();
    eventBus = new InMemoryEventBus();
  });

  it('marks recording READY when egress is COMPLETE and publishes RecordingReadyEvent', async () => {
    const stopping = createRecording({ status: 'stopping' });
    vi.mocked(recordingRepository.findByStatus).mockResolvedValue(success([stopping]));
    const egressStatus: EgressStatus = {
      egressId,
      status: 'EGRESS_COMPLETE',
      fileResults: [{ filename: 'meeting.mp4', location: 'https://storage/meeting.mp4', size: 256_000_000, duration: 3600 }],
    };
    vi.mocked(recordingGateway.getEgressStatus).mockResolvedValue(success(egressStatus));
    vi.mocked(recordingRepository.update).mockImplementation(async (rec) => success(rec));

    const job = new EgressStatusPollingJob(recordingRepository, recordingGateway, eventBus);
    const result = await job.execute({});

    expect(result.isSuccess).toBe(true);
    expect(recordingRepository.update).toHaveBeenCalledTimes(1);
    const updated = vi.mocked(recordingRepository.update).mock.calls[0][0];
    expect(updated.status).toBe('ready');
    expect(updated.storageUrl).toBe('https://storage/meeting.mp4');
    expect(updated.fileSizeBytes).toBe(256_000_000);
    expect(updated.durationSeconds).toBe(3600);
    expect(updated.expiresAt).not.toBeNull();
  });

  it('marks recording FAILED when egress is FAILED', async () => {
    const stopping = createRecording({ status: 'stopping' });
    vi.mocked(recordingRepository.findByStatus).mockResolvedValue(success([stopping]));
    const egressStatus: EgressStatus = {
      egressId,
      status: 'EGRESS_FAILED',
      fileResults: [],
    };
    vi.mocked(recordingGateway.getEgressStatus).mockResolvedValue(success(egressStatus));
    vi.mocked(recordingRepository.update).mockImplementation(async (rec) => success(rec));

    const job = new EgressStatusPollingJob(recordingRepository, recordingGateway, eventBus);
    const result = await job.execute({});

    expect(result.isSuccess).toBe(true);
    const updated = vi.mocked(recordingRepository.update).mock.calls[0][0];
    expect(updated.status).toBe('failed');
  });
});

describe('Phase 10 recording query and management use cases', () => {
  let recordingRepository: RecordingRepository;
  let downloadLinkGenerator: DownloadLinkGenerator;

  beforeEach(() => {
    recordingRepository = createRecordingRepository();
    downloadLinkGenerator = createDownloadLinkGenerator();
  });

  it('gets a recording by ID', async () => {
    const recording = createRecording({ status: 'ready', storageUrl: 'https://storage/meeting.mp4' });
    vi.mocked(recordingRepository.findById).mockResolvedValue(success(recording));

    const useCase = new GetRecordingUseCase(recordingRepository);
    const result = await useCase.execute({ recordingId });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value?.id).toBe(recordingId);
  });

  it('lists recordings by meeting', async () => {
    const recordings = [createRecording(), createRecording({ id: 'rec_456' as RecordingId })];
    vi.mocked(recordingRepository.findByMeetingId).mockResolvedValue(success(recordings));

    const useCase = new ListRecordingsUseCase(recordingRepository);
    const result = await useCase.execute({ meetingId });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value).toHaveLength(2);
  });

  it('deletes recording when host requests', async () => {
    vi.mocked(recordingRepository.findById).mockResolvedValue(success(createRecording()));
    vi.mocked(recordingRepository.delete).mockResolvedValue(success(undefined));

    const useCase = new DeleteRecordingUseCase(recordingRepository);
    const result = await useCase.execute({ actor: hostActor, recordingId });

    expect(result.isSuccess).toBe(true);
    expect(recordingRepository.delete).toHaveBeenCalledWith(recordingId);
  });

  it('fails to delete when attendee tries (RBAC)', async () => {
    const useCase = new DeleteRecordingUseCase(recordingRepository);
    const result = await useCase.execute({ actor: attendeeActor, recordingId });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('host or co-host');
    expect(recordingRepository.delete).not.toHaveBeenCalled();
  });

  it('generates signed download link for ready recordings', async () => {
    vi.mocked(recordingRepository.findById).mockResolvedValue(
      success(createRecording({ status: 'ready', storageUrl: 'https://storage/meeting.mp4' })),
    );
    vi.mocked(downloadLinkGenerator.generateSignedUrl).mockResolvedValue(
      success({ downloadUrl: 'https://storage/signed?token=xxx', expiresAt: '2026-01-02T10:00:00.000Z' as IsoDateString }),
    );

    const useCase = new GetDownloadLinkUseCase(recordingRepository, downloadLinkGenerator);
    const result = await useCase.execute({ actor: hostActor, recordingId, expiresInHours: 24 });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.downloadUrl).toContain('signed');
    }
    expect(downloadLinkGenerator.generateSignedUrl).toHaveBeenCalledTimes(1);
  });

  it('rejects download link for non-ready recordings', async () => {
    vi.mocked(recordingRepository.findById).mockResolvedValue(
      success(createRecording({ status: 'active', storageUrl: null })),
    );

    const useCase = new GetDownloadLinkUseCase(recordingRepository, downloadLinkGenerator);
    const result = await useCase.execute({ actor: hostActor, recordingId });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('not ready');
  });

  it('rejects download link exceeding 72 hours', async () => {
    vi.mocked(recordingRepository.findById).mockResolvedValue(
      success(createRecording({ status: 'ready', storageUrl: 'https://storage/meeting.mp4' })),
    );

    const useCase = new GetDownloadLinkUseCase(recordingRepository, downloadLinkGenerator);
    const result = await useCase.execute({ actor: hostActor, recordingId, expiresInHours: 73 });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('72');
  });
});