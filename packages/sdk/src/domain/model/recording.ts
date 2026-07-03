import type { IsoDateString, MeetingId, ParticipantId, RecordingId, Uuid } from '@aimeetx/types';

export type RecordingLayout = 'speaker_view' | 'gallery_view' | 'audio_only';

export type RecordingStatus =
  | 'starting'
  | 'active'
  | 'stopping'
  | 'ready'
  | 'failed'
  | 'expired';

export interface MeetingRecording {
  readonly id: RecordingId;
  readonly meetingId: MeetingId;
  readonly egressId: string;
  readonly layout: RecordingLayout;
  readonly status: RecordingStatus;
  readonly storageUrl: string | null;
  readonly fileSizeBytes: number | null;
  readonly durationSeconds: number | null;
  readonly startedBy: ParticipantId;
  readonly startedAt: IsoDateString;
  readonly stoppedAt: IsoDateString | null;
  readonly expiresAt: IsoDateString | null;
}

export interface EgressFileResult {
  readonly filename: string;
  readonly location: string;
  readonly size: number;
  readonly duration: number;
}

export interface EgressStatus {
  readonly egressId: string;
  readonly status: 'EGRESS_ACTIVE' | 'EGRESS_COMPLETE' | 'EGRESS_FAILED';
  readonly fileResults: ReadonlyArray<EgressFileResult>;
}

export interface PlaybackSession {
  readonly id: Uuid;
  readonly recordingId: RecordingId;
  readonly userId: import('@aimeetx/types').UserId;
  readonly startedAt: IsoDateString;
  readonly endedAt: IsoDateString | null;
  readonly positionSeconds: number;
}

export const RECORDING_CONSTRAINTS = {
  MAX_DOWNLOAD_LINK_HOURS: 72,
  DEFAULT_DOWNLOAD_LINK_HOURS: 24,
  DEFAULT_RETENTION_DAYS: 30,
  POLLING_INTERVAL_MS: 30_000,
  MAX_FILE_SIZE_BYTES: 5_000_000_000,
} as const;

export function isRecordingActive(status: RecordingStatus): boolean {
  return status === 'starting' || status === 'active' || status === 'stopping';
}

export function isRecordingTerminal(status: RecordingStatus): boolean {
  return status === 'ready' || status === 'failed' || status === 'expired';
}

export function canManageRecording(role: import('../model/meeting.js').ParticipantRole): boolean {
  return role === 'host' || role === 'co_host';
}
