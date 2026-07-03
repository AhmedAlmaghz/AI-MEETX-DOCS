import { inject, injectable } from 'tsyringe';

import type { MeetingId, ParticipantId, RecordingId, Result, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type { Meeting } from '../model/meeting.js';
import type {
  MeetingRecording,
} from '../model/recording.js';
import { canManageRecording, isRecordingActive, RECORDING_CONSTRAINTS } from '../model/recording.js';
import type {
  DownloadLinkGenerator,
  RecordingActorClaims,
  RecordingGateway,
  RecordingRepository,
  StartRecordingInput,
} from '../port/recording-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

function buildEvent<T extends string>(
  eventType: T,
  sourceModule: string,
  payload: Readonly<Record<string, unknown>>,
): {
  eventId: Uuid;
  eventType: T;
  version: number;
  timestamp: import('@aimeetx/types').IsoDateString;
  sourceModule: string;
  correlationId: Uuid;
  payload: Readonly<Record<string, unknown>>;
} {
  return {
    eventId: crypto.randomUUID() as Uuid,
    eventType,
    version: 1,
    timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
    sourceModule,
    correlationId: crypto.randomUUID() as Uuid,
    payload,
  };
}

function generateRecordingId(): RecordingId {
  return `rec_${crypto.randomUUID()}` as RecordingId;
}

function assertCanManage(actor: RecordingActorClaims): Error | null {
  return canManageRecording(actor.role)
    ? null
    : new Error('Only host or co-host can manage recordings');
}

// ============================================================================
// StartRecordingUseCase
// ============================================================================

export interface StartRecordingCommand {
  readonly actor: RecordingActorClaims;
  readonly input: StartRecordingInput;
  readonly meeting: Meeting;
}

@injectable()
export class StartRecordingUseCase implements UseCase<StartRecordingCommand, MeetingRecording, Error> {
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
    @inject(TOKENS.RecordingGateway)
    private readonly recordingGateway: RecordingGateway,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartRecordingCommand): Promise<Result<MeetingRecording, Error>> {
    const { actor, input, meeting } = command;

    const roleError = assertCanManage(actor);
    if (roleError) return failure(roleError);

    if (meeting.status !== 'active') {
      return failure(new Error('Meeting must be active to start recording'));
    }

    const existingResult = await this.recordingRepository.findByMeetingId(input.meetingId);
    if (existingResult.isFailure) return failure(existingResult.error);
    const hasActive = existingResult.value.some((r) => isRecordingActive(r.status));
    if (hasActive) {
      return failure(new Error('A recording is already active for this meeting'));
    }

    const egressResult = await this.recordingGateway.startEgress(
      input.roomName,
      input.layout,
      input.storageBucket,
    );
    if (egressResult.isFailure) return failure(egressResult.error);

    const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
    const recording: MeetingRecording = {
      id: generateRecordingId(),
      meetingId: input.meetingId,
      egressId: egressResult.value,
      layout: input.layout,
      status: 'starting',
      storageUrl: null,
      fileSizeBytes: null,
      durationSeconds: null,
      startedBy: input.hostId,
      startedAt: now,
      stoppedAt: null,
      expiresAt: null,
    };

    const saveResult = await this.recordingRepository.save(recording);
    if (saveResult.isFailure) return failure(saveResult.error);

    const saved = saveResult.value;

    this.eventBus.publish(
      buildEvent('RecordingStarted', '@aimeetx/sdk/recording', {
        meetingId: input.meetingId,
        recordingId: saved.id,
        layout: saved.layout,
        startedBy: input.hostId,
        startedAt: saved.startedAt,
      }),
    );

    return success(saved);
  }
}

// ============================================================================
// StopRecordingUseCase
// ============================================================================

export interface StopRecordingCommand {
  readonly actor: RecordingActorClaims;
  readonly meetingId: MeetingId;
  readonly recordingId: RecordingId;
  readonly stoppedBy: ParticipantId;
}

@injectable()
export class StopRecordingUseCase implements UseCase<StopRecordingCommand, MeetingRecording, Error> {
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
    @inject(TOKENS.RecordingGateway)
    private readonly recordingGateway: RecordingGateway,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StopRecordingCommand): Promise<Result<MeetingRecording, Error>> {
    const { actor, recordingId, stoppedBy } = command;

    const roleError = assertCanManage(actor);
    if (roleError) return failure(roleError);

    const findResult = await this.recordingRepository.findById(recordingId);
    if (findResult.isFailure) return failure(findResult.error);
    if (!findResult.value) return failure(new Error('Recording not found'));

    const recording = findResult.value;

    if (recording.status !== 'active' && recording.status !== 'starting') {
      return failure(new Error('Recording is not active'));
    }

    const stopResult = await this.recordingGateway.stopEgress(recording.egressId);
    if (stopResult.isFailure) return failure(stopResult.error);

    const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
    const updated: MeetingRecording = {
      ...recording,
      status: 'stopping',
      stoppedAt: now,
    };

    const updateResult = await this.recordingRepository.update(updated);
    if (updateResult.isFailure) return failure(updateResult.error);

    this.eventBus.publish(
      buildEvent('RecordingStopped', '@aimeetx/sdk/recording', {
        meetingId: command.meetingId,
        recordingId,
        stoppedBy,
        stoppedAt: now,
      }),
    );

    return success(updateResult.value);
  }
}

// ============================================================================
// GetRecordingUseCase
// ============================================================================

export interface GetRecordingCommand {
  readonly recordingId: RecordingId;
}

@injectable()
export class GetRecordingUseCase implements UseCase<GetRecordingCommand, MeetingRecording | null, Error> {
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
  ) {}

  async execute(command: GetRecordingCommand): Promise<Result<MeetingRecording | null, Error>> {
    return this.recordingRepository.findById(command.recordingId);
  }
}

// ============================================================================
// ListRecordingsUseCase
// ============================================================================

export interface ListRecordingsCommand {
  readonly meetingId: MeetingId;
}

@injectable()
export class ListRecordingsUseCase
  implements UseCase<ListRecordingsCommand, ReadonlyArray<MeetingRecording>, Error>
{
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
  ) {}

  async execute(command: ListRecordingsCommand): Promise<Result<ReadonlyArray<MeetingRecording>, Error>> {
    return this.recordingRepository.findByMeetingId(command.meetingId);
  }
}

// ============================================================================
// DeleteRecordingUseCase
// ============================================================================

export interface DeleteRecordingCommand {
  readonly actor: RecordingActorClaims;
  readonly recordingId: RecordingId;
}

@injectable()
export class DeleteRecordingUseCase implements UseCase<DeleteRecordingCommand, void, Error> {
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
  ) {}

  async execute(command: DeleteRecordingCommand): Promise<Result<void, Error>> {
    const roleError = assertCanManage(command.actor);
    if (roleError) return failure(roleError);

    const findResult = await this.recordingRepository.findById(command.recordingId);
    if (findResult.isFailure) return failure(findResult.error);
    if (!findResult.value) return failure(new Error('Recording not found'));

    return this.recordingRepository.delete(command.recordingId);
  }
}

// ============================================================================
// GetDownloadLinkUseCase
// ============================================================================

export interface GetDownloadLinkCommand {
  readonly actor: RecordingActorClaims;
  readonly recordingId: RecordingId;
  readonly expiresInHours?: number;
}

@injectable()
export class GetDownloadLinkUseCase
  implements UseCase<GetDownloadLinkCommand, { readonly downloadUrl: string; readonly expiresAt: import('@aimeetx/types').IsoDateString }, Error>
{
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
    @inject(TOKENS.DownloadLinkGenerator)
    private readonly downloadLinkGenerator: DownloadLinkGenerator,
  ) {}

  async execute(command: GetDownloadLinkCommand): Promise<Result<{ readonly downloadUrl: string; readonly expiresAt: import('@aimeetx/types').IsoDateString }, Error>> {
    const roleError = assertCanManage(command.actor);
    if (roleError) return failure(roleError);

    const findResult = await this.recordingRepository.findById(command.recordingId);
    if (findResult.isFailure) return failure(findResult.error);
    if (!findResult.value) return failure(new Error('Recording not found'));

    const recording = findResult.value;
    if (recording.status !== 'ready' || !recording.storageUrl) {
      return failure(new Error('Recording is not ready for download'));
    }

    const hours = command.expiresInHours ?? RECORDING_CONSTRAINTS.DEFAULT_DOWNLOAD_LINK_HOURS;
    if (hours < 1 || hours > RECORDING_CONSTRAINTS.MAX_DOWNLOAD_LINK_HOURS) {
      return failure(new Error(`Download link expiration must be between 1 and ${RECORDING_CONSTRAINTS.MAX_DOWNLOAD_LINK_HOURS} hours`));
    }

    return this.downloadLinkGenerator.generateSignedUrl(recording.id, recording.storageUrl, hours);
  }
}

// ============================================================================
// EgressStatusPollingJob
// ============================================================================

export interface EgressPollingCommand {
  readonly dummy?: boolean;
}

@injectable()
export class EgressStatusPollingJob implements UseCase<EgressPollingCommand, void, Error> {
  constructor(
    @inject(TOKENS.RecordingRepository)
    private readonly recordingRepository: RecordingRepository,
    @inject(TOKENS.RecordingGateway)
    private readonly recordingGateway: RecordingGateway,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(_command: EgressPollingCommand): Promise<Result<void, Error>> {
    const stoppingResult = await this.recordingRepository.findByStatus('stopping');
    if (stoppingResult.isFailure) return failure(stoppingResult.error);

    for (const recording of stoppingResult.value) {
      const statusResult = await this.recordingGateway.getEgressStatus(recording.egressId);
      if (statusResult.isFailure) continue;

      const egressStatus = statusResult.value;

      if (egressStatus.status === 'EGRESS_COMPLETE') {
        const file = egressStatus.fileResults[0];
        if (!file) continue;

        const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
        const expiresAt = new Date(Date.now() + RECORDING_CONSTRAINTS.DEFAULT_RETENTION_DAYS * 86_400_000).toISOString() as import('@aimeetx/types').IsoDateString;

        const updated: MeetingRecording = {
          ...recording,
          status: 'ready',
          storageUrl: file.location,
          fileSizeBytes: file.size,
          durationSeconds: file.duration,
          expiresAt,
        };

        const updateResult = await this.recordingRepository.update(updated);
        if (updateResult.isFailure) continue;

        this.eventBus.publish(
          buildEvent('RecordingReady', '@aimeetx/sdk/recording', {
            meetingId: recording.meetingId,
            recordingId: recording.id,
            storageUrl: file.location,
            fileSizeBytes: file.size,
            durationSeconds: file.duration,
            expiresAt,
            readyAt: now,
          }),
        );
      } else if (egressStatus.status === 'EGRESS_FAILED') {
        const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
        const updated: MeetingRecording = {
          ...recording,
          status: 'failed',
        };

        const updateResult = await this.recordingRepository.update(updated);
        if (updateResult.isFailure) continue;

        this.eventBus.publish(
          buildEvent('RecordingFailed', '@aimeetx/sdk/recording', {
            meetingId: recording.meetingId,
            recordingId: recording.id,
            reason: 'Egress processing failed',
            failedAt: now,
          }),
        );
      }
    }

    return success(undefined);
  }
}