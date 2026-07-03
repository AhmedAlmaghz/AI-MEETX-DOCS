import type { RecordingId, Result, MeetingId, ParticipantId, UserId } from '@aimeetx/types';

import type {
  EgressStatus,
  MeetingRecording,
  RecordingLayout,
} from '../model/recording.js';

export interface StartRecordingInput {
  readonly meetingId: MeetingId;
  readonly hostId: ParticipantId;
  readonly layout: RecordingLayout;
  readonly roomName: string;
  readonly storageBucket: string;
}

export interface RecordingRepository {
  save(recording: MeetingRecording): Promise<Result<MeetingRecording, Error>>;
  findById(id: RecordingId): Promise<Result<MeetingRecording | null, Error>>;
  findByMeetingId(meetingId: MeetingId): Promise<Result<ReadonlyArray<MeetingRecording>, Error>>;
  findByStatus(status: MeetingRecording['status']): Promise<Result<ReadonlyArray<MeetingRecording>, Error>>;
  update(recording: MeetingRecording): Promise<Result<MeetingRecording, Error>>;
  delete(id: RecordingId): Promise<Result<void, Error>>;
}

export interface RecordingGateway {
  startEgress(
    roomName: string,
    layout: RecordingLayout,
    storageBucket: string,
  ): Promise<Result<string, Error>>;

  stopEgress(egressId: string): Promise<Result<void, Error>>;

  getEgressStatus(egressId: string): Promise<Result<EgressStatus, Error>>;
}

export interface DownloadLinkGenerator {
  generateSignedUrl(
    recordingId: RecordingId,
    storageUrl: string,
    expiresInHours: number,
  ): Promise<Result<{ readonly downloadUrl: string; readonly expiresAt: import('@aimeetx/types').IsoDateString }, Error>>;
}

export type RecordingActorClaims = {
  readonly userId: UserId;
  readonly role: import('../model/meeting.js').ParticipantRole;
};