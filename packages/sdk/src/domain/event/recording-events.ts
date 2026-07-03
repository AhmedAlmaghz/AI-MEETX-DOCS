import type {
  DomainEvent,
  IsoDateString,
  MeetingId,
  RecordingId,
} from '@aimeetx/types';

import type { RecordingLayout } from '../model/recording.js';

export interface RecordingStartedEvent extends DomainEvent {
  readonly eventType: 'RecordingStarted';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly recordingId: RecordingId;
    readonly layout: RecordingLayout;
    readonly startedBy: string;
    readonly startedAt: IsoDateString;
  };
}

export interface RecordingStoppedEvent extends DomainEvent {
  readonly eventType: 'RecordingStopped';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly recordingId: RecordingId;
    readonly stoppedBy: string;
    readonly stoppedAt: IsoDateString;
  };
}

export interface RecordingReadyEvent extends DomainEvent {
  readonly eventType: 'RecordingReady';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly recordingId: RecordingId;
    readonly storageUrl: string;
    readonly fileSizeBytes: number;
    readonly durationSeconds: number;
    readonly expiresAt: IsoDateString;
    readonly readyAt: IsoDateString;
  };
}

export interface RecordingFailedEvent extends DomainEvent {
  readonly eventType: 'RecordingFailed';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly recordingId: RecordingId;
    readonly reason: string;
    readonly failedAt: IsoDateString;
  };
}

export type RecordingEvent =
  | RecordingStartedEvent
  | RecordingStoppedEvent
  | RecordingReadyEvent
  | RecordingFailedEvent;
