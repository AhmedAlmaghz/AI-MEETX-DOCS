import type { MeetingId, ParticipantId, Result, UserId } from '@aimeetx/types';

import type {
  Meeting,
  MeetingSettings,
  Participant,
  ParticipantRole,
  ParticipantStatus,
} from '../model/meeting.js';

// ============================================================================
// Meeting Repository Port
// ============================================================================

/**
 * Meeting creation input.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: meeting creation parameters.
 */
export interface CreateMeetingInput {
  readonly title: string;
  readonly description?: string;
  readonly hostId: UserId;
  readonly maxParticipants?: number;
  readonly passcode?: string;
  readonly settings?: Partial<MeetingSettings>;
}

/**
 * Meeting update input.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: meeting update parameters.
 */
export interface MeetingUpdate {
  readonly title?: string;
  readonly description?: string;
  readonly maxParticipants?: number;
  readonly settings?: Partial<MeetingSettings>;
}

/**
 * Meeting repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., HttpMeetingRepository).
 *
 * Per feature-meeting/lifecycle/SPECIFICATION.md: Meeting repository operations.
 */
export interface MeetingRepository {
  /** Create a new meeting. */
  createMeeting(input: CreateMeetingInput): Promise<Result<Meeting, Error>>;

  /** Get a meeting by ID. */
  getMeeting(meetingId: MeetingId): Promise<Result<Meeting | null, Error>>;

  /** Update meeting details. */
  updateMeeting(meetingId: MeetingId, update: MeetingUpdate): Promise<Result<Meeting, Error>>;

  /** Update meeting status. */
  updateMeetingStatus(
    meetingId: MeetingId,
    status: Meeting['status'],
  ): Promise<Result<Meeting, Error>>;

  /** Start a meeting (transition to ACTIVE). */
  startMeeting(meetingId: MeetingId): Promise<Result<Meeting, Error>>;

  /** End a meeting (transition to ENDED). */
  endMeeting(meetingId: MeetingId): Promise<Result<Meeting, Error>>;

  /** Delete a meeting. */
  deleteMeeting(meetingId: MeetingId): Promise<Result<void, Error>>;

  /** List meetings for a user (as host). */
  listMeetingsByHost(hostId: UserId): Promise<Result<ReadonlyArray<Meeting>, Error>>;

  /** List active meetings. */
  listActiveMeetings(): Promise<Result<ReadonlyArray<Meeting>, Error>>;
}

// ============================================================================
// Participant Repository Port
// ============================================================================

/**
 * Join meeting input.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: join parameters.
 */
export interface JoinMeetingInput {
  readonly meetingId: MeetingId;
  readonly userId: UserId | null;
  readonly displayName: string;
  readonly role?: ParticipantRole;
  readonly passcode?: string;
  readonly invitationToken?: string;
}

/**
 * Participant repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 *
 * Per feature-meeting/participants/SPECIFICATION.md: Participant repository operations.
 */
export interface ParticipantRepository {
  /** Add a participant to a meeting. */
  joinMeeting(input: JoinMeetingInput): Promise<Result<Participant, Error>>;

  /** Get a participant by ID. */
  getParticipant(participantId: ParticipantId): Promise<Result<Participant | null, Error>>;

  /** Get a participant by meeting and user ID. */
  getParticipantByMeetingAndUser(
    meetingId: MeetingId,
    userId: UserId,
  ): Promise<Result<Participant | null, Error>>;

  /** List all participants in a meeting. */
  listParticipants(meetingId: MeetingId): Promise<Result<ReadonlyArray<Participant>, Error>>;

  /** List participants by status. */
  listParticipantsByStatus(
    meetingId: MeetingId,
    status: ParticipantStatus,
  ): Promise<Result<ReadonlyArray<Participant>, Error>>;

  /** Update participant status. */
  updateParticipantStatus(
    participantId: ParticipantId,
    status: ParticipantStatus,
  ): Promise<Result<Participant, Error>>;

  /** Update participant role. */
  updateParticipantRole(
    participantId: ParticipantId,
    role: ParticipantRole,
  ): Promise<Result<Participant, Error>>;

  /** Mute a participant. */
  muteParticipant(participantId: ParticipantId, muted: boolean): Promise<Result<Participant, Error>>;

  /** Update participant video state. */
  updateParticipantVideo(
    participantId: ParticipantId,
    videoOn: boolean,
  ): Promise<Result<Participant, Error>>;

  /** Update participant screen sharing state. */
  updateParticipantScreenShare(
    participantId: ParticipantId,
    screenSharing: boolean,
  ): Promise<Result<Participant, Error>>;

  /** Update participant hand raised state. */
  updateParticipantHandRaised(
    participantId: ParticipantId,
    handRaised: boolean,
  ): Promise<Result<Participant, Error>>;

  /** Remove a participant from a meeting. */
  removeParticipant(participantId: ParticipantId): Promise<Result<void, Error>>;

  /** Remove all participants from a meeting. */
  removeAllParticipants(meetingId: MeetingId): Promise<Result<void, Error>>;

  /** Count active participants in a meeting. */
  countActiveParticipants(meetingId: MeetingId): Promise<Result<number, Error>>;
}