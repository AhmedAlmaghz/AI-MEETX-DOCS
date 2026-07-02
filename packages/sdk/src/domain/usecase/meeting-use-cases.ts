import { inject, injectable } from 'tsyringe';

import type { MeetingId, ParticipantId, Result, UserId, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type {
  Meeting,
  Participant,
  ParticipantRole,
} from '../model/meeting.js';
import {
  canManageRoles,
  canMuteOthers,
  MEETING_CONSTRAINTS,
} from '../model/meeting.js';
import type {
  CreateMeetingInput,
  JoinMeetingInput,
  MeetingRepository,
  MeetingUpdate,
  ParticipantRepository,
} from '../port/meeting-repository.js';
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

/**
 * Validate a meeting title.
 */
function validateTitle(title: string): string | null {
  if (title.length < MEETING_CONSTRAINTS.MIN_TITLE_LENGTH) {
    return `Title must be at least ${MEETING_CONSTRAINTS.MIN_TITLE_LENGTH} character`;
  }
  if (title.length > MEETING_CONSTRAINTS.MAX_TITLE_LENGTH) {
    return `Title must be at most ${MEETING_CONSTRAINTS.MAX_TITLE_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate a display name.
 */
function validateDisplayName(displayName: string): string | null {
  if (displayName.length < MEETING_CONSTRAINTS.DISPLAY_NAME_MIN_LENGTH) {
    return `Display name must be at least ${MEETING_CONSTRAINTS.DISPLAY_NAME_MIN_LENGTH} character`;
  }
  if (displayName.length > MEETING_CONSTRAINTS.DISPLAY_NAME_MAX_LENGTH) {
    return `Display name must be at most ${MEETING_CONSTRAINTS.DISPLAY_NAME_MAX_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate max participants.
 */
function validateMaxParticipants(maxParticipants: number): string | null {
  if (maxParticipants < 1) {
    return 'Max participants must be at least 1';
  }
  if (maxParticipants > MEETING_CONSTRAINTS.MAX_PARTICIPANTS_LIMIT) {
    return `Max participants cannot exceed ${MEETING_CONSTRAINTS.MAX_PARTICIPANTS_LIMIT}`;
  }
  return null;
}

// ============================================================================
// CreateMeetingUseCase
// ============================================================================

/**
 * Command for CreateMeetingUseCase.
 */
export interface CreateMeetingCommand {
  readonly input: CreateMeetingInput;
}

/**
 * CreateMeetingUseCase — creates a new meeting.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: creates meeting in SCHEDULED status.
 */
@injectable()
export class CreateMeetingUseCase implements UseCase<CreateMeetingCommand, Meeting, Error> {
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateMeetingCommand): Promise<Result<Meeting, Error>> {
    const { input } = command;

    // Validate title
    const titleError = validateTitle(input.title);
    if (titleError) return failure(new Error(titleError));

    // Validate max participants if provided
    if (input.maxParticipants !== undefined) {
      const maxError = validateMaxParticipants(input.maxParticipants);
      if (maxError) return failure(new Error(maxError));
    }

    // Create meeting
    const result = await this.meetingRepository.createMeeting(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const meeting = result.value;

    // Publish MeetingCreatedEvent
    this.eventBus.publish(
      buildEvent('MeetingCreated', '@aimeetx/sdk/meeting', {
        meetingId: meeting.id,
        title: meeting.title,
        hostId: meeting.hostId,
        status: meeting.status,
        createdAt: meeting.createdAt,
      }),
    );

    return success(meeting);
  }
}

// ============================================================================
// GetMeetingUseCase
// ============================================================================

/**
 * Command for GetMeetingUseCase.
 */
export interface GetMeetingCommand {
  readonly meetingId: MeetingId;
}

/**
 * GetMeetingUseCase — retrieves a meeting by ID.
 */
@injectable()
export class GetMeetingUseCase implements UseCase<GetMeetingCommand, Meeting | null, Error> {
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
  ) {}

  async execute(command: GetMeetingCommand): Promise<Result<Meeting | null, Error>> {
    const result = await this.meetingRepository.getMeeting(command.meetingId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// UpdateMeetingUseCase
// ============================================================================

/**
 * Command for UpdateMeetingUseCase.
 */
export interface UpdateMeetingCommand {
  readonly meetingId: MeetingId;
  readonly update: MeetingUpdate;
  readonly updatedBy: UserId;
}

/**
 * UpdateMeetingUseCase — updates meeting details.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: only host can update.
 */
@injectable()
export class UpdateMeetingUseCase implements UseCase<UpdateMeetingCommand, Meeting, Error> {
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateMeetingCommand): Promise<Result<Meeting, Error>> {
    const { meetingId, update, updatedBy } = command;

    // Validate title if provided
    if (update.title !== undefined) {
      const titleError = validateTitle(update.title);
      if (titleError) return failure(new Error(titleError));
    }

    // Validate max participants if provided
    if (update.maxParticipants !== undefined) {
      const maxError = validateMaxParticipants(update.maxParticipants);
      if (maxError) return failure(new Error(maxError));
    }

    // Get meeting to verify host
    const meetingResult = await this.meetingRepository.getMeeting(meetingId);
    if (meetingResult.isFailure) {
      return failure(meetingResult.error);
    }
    if (!meetingResult.value) {
      return failure(new Error('Meeting not found'));
    }
    if (meetingResult.value.hostId !== updatedBy) {
      return failure(new Error('Only the host can update the meeting'));
    }

    // Update meeting
    const result = await this.meetingRepository.updateMeeting(meetingId, update);
    if (result.isFailure) {
      return failure(result.error);
    }

    const meeting = result.value;

    // Publish MeetingUpdatedEvent
    this.eventBus.publish(
      buildEvent('MeetingUpdated', '@aimeetx/sdk/meeting', {
        meetingId,
        updatedFields: Object.keys(update),
        updatedAt: meeting.updatedAt,
        updatedBy,
      }),
    );

    return success(meeting);
  }
}

// ============================================================================
// StartMeetingUseCase
// ============================================================================

/**
 * Command for StartMeetingUseCase.
 */
export interface StartMeetingCommand {
  readonly meetingId: MeetingId;
  readonly startedBy: UserId;
}

/**
 * StartMeetingUseCase — starts a meeting (transitions to ACTIVE).
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: only host can start.
 */
@injectable()
export class StartMeetingUseCase implements UseCase<StartMeetingCommand, Meeting, Error> {
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartMeetingCommand): Promise<Result<Meeting, Error>> {
    const { meetingId, startedBy } = command;

    // Get meeting to verify host
    const meetingResult = await this.meetingRepository.getMeeting(meetingId);
    if (meetingResult.isFailure) {
      return failure(meetingResult.error);
    }
    if (!meetingResult.value) {
      return failure(new Error('Meeting not found'));
    }
    if (meetingResult.value.hostId !== startedBy) {
      return failure(new Error('Only the host can start the meeting'));
    }
    if (meetingResult.value.status === 'ended') {
      return failure(new Error('Meeting has already ended'));
    }

    // Start meeting
    const result = await this.meetingRepository.startMeeting(meetingId);
    if (result.isFailure) {
      return failure(result.error);
    }

    const meeting = result.value;

    // Publish MeetingStartedEvent
    this.eventBus.publish(
      buildEvent('MeetingStarted', '@aimeetx/sdk/meeting', {
        meetingId,
        startedAt: meeting.startedAt,
        startedBy,
      }),
    );

    return success(meeting);
  }
}

// ============================================================================
// EndMeetingUseCase
// ============================================================================

/**
 * Command for EndMeetingUseCase.
 */
export interface EndMeetingCommand {
  readonly meetingId: MeetingId;
  readonly endedBy: UserId;
  readonly reason?: 'host_ended' | 'scheduled_end' | 'timeout';
}

/**
 * EndMeetingUseCase — ends a meeting (transitions to ENDED).
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: only host can end.
 */
@injectable()
export class EndMeetingUseCase implements UseCase<EndMeetingCommand, Meeting, Error> {
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EndMeetingCommand): Promise<Result<Meeting, Error>> {
    const { meetingId, endedBy, reason = 'host_ended' } = command;

    // Get meeting to verify host
    const meetingResult = await this.meetingRepository.getMeeting(meetingId);
    if (meetingResult.isFailure) {
      return failure(meetingResult.error);
    }
    if (!meetingResult.value) {
      return failure(new Error('Meeting not found'));
    }
    if (meetingResult.value.hostId !== endedBy) {
      return failure(new Error('Only the host can end the meeting'));
    }
    if (meetingResult.value.status === 'ended') {
      return failure(new Error('Meeting has already ended'));
    }

    // End meeting
    const result = await this.meetingRepository.endMeeting(meetingId);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Remove all participants
    await this.participantRepository.removeAllParticipants(meetingId);

    const meeting = result.value;

    // Publish MeetingEndedEvent
    this.eventBus.publish(
      buildEvent('MeetingEnded', '@aimeetx/sdk/meeting', {
        meetingId,
        endedAt: meeting.endedAt,
        endedBy,
        reason,
      }),
    );

    return success(meeting);
  }
}

// ============================================================================
// JoinMeetingUseCase
// ============================================================================

/**
 * Command for JoinMeetingUseCase.
 */
export interface JoinMeetingCommand {
  readonly input: JoinMeetingInput;
}

/**
 * JoinMeetingUseCase — adds a participant to a meeting.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: handles join logic.
 */
@injectable()
export class JoinMeetingUseCase implements UseCase<JoinMeetingCommand, Participant, Error> {
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: JoinMeetingCommand): Promise<Result<Participant, Error>> {
    const { input } = command;

    // Validate display name
    const nameError = validateDisplayName(input.displayName);
    if (nameError) return failure(new Error(nameError));

    // Get meeting
    const meetingResult = await this.meetingRepository.getMeeting(input.meetingId);
    if (meetingResult.isFailure) {
      return failure(meetingResult.error);
    }
    if (!meetingResult.value) {
      return failure(new Error('Meeting not found'));
    }

    const meeting = meetingResult.value;

    // Check if meeting has ended
    if (meeting.status === 'ended') {
      return failure(new Error('Meeting has already ended'));
    }

    // Check capacity
    const countResult = await this.participantRepository.countActiveParticipants(input.meetingId);
    if (countResult.isFailure) {
      return failure(countResult.error);
    }
    if (countResult.value >= meeting.maxParticipants) {
      return failure(
        new Error(`Meeting is at capacity (${meeting.maxParticipants} participants)`),
      );
    }

    // Join meeting
    const result = await this.participantRepository.joinMeeting(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const participant = result.value;

    // Publish ParticipantJoinedEvent
    this.eventBus.publish(
      buildEvent('ParticipantJoined', '@aimeetx/sdk/meeting', {
        meetingId: input.meetingId,
        participantId: participant.id,
        userId: participant.userId,
        displayName: participant.displayName,
        role: participant.role,
        joinedAt: participant.joinedAt,
      }),
    );

    return success(participant);
  }
}

// ============================================================================
// LeaveMeetingUseCase
// ============================================================================

/**
 * Command for LeaveMeetingUseCase.
 */
export interface LeaveMeetingCommand {
  readonly participantId: ParticipantId;
  readonly reason?: 'voluntary' | 'removed' | 'disconnected';
}

/**
 * LeaveMeetingUseCase — removes a participant from a meeting.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: handles leave logic.
 */
@injectable()
export class LeaveMeetingUseCase implements UseCase<LeaveMeetingCommand, void, Error> {
  constructor(
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LeaveMeetingCommand): Promise<Result<void, Error>> {
    const { participantId, reason = 'voluntary' } = command;

    // Get participant
    const participantResult = await this.participantRepository.getParticipant(participantId);
    if (participantResult.isFailure) {
      return failure(participantResult.error);
    }
    if (!participantResult.value) {
      return failure(new Error('Participant not found'));
    }

    const participant = participantResult.value;

    // Update status
    await this.participantRepository.updateParticipantStatus(
      participantId,
      reason === 'voluntary' ? 'left' : reason === 'removed' ? 'removed' : 'disconnected',
    );

    // Publish ParticipantLeftEvent
    this.eventBus.publish(
      buildEvent('ParticipantLeft', '@aimeetx/sdk/meeting', {
        meetingId: participant.meetingId,
        participantId,
        leftAt: new Date().toISOString(),
        reason,
      }),
    );

    return success(undefined);
  }
}

// ============================================================================
// MuteParticipantUseCase
// ============================================================================

/**
 * Command for MuteParticipantUseCase.
 */
export interface MuteParticipantCommand {
  readonly participantId: ParticipantId;
  readonly muted: boolean;
  readonly mutedBy: ParticipantId;
}

/**
 * MuteParticipantUseCase — mutes or unmutes a participant.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: only privileged roles can mute others.
 */
@injectable()
export class MuteParticipantUseCase implements UseCase<MuteParticipantCommand, Participant, Error> {
  constructor(
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MuteParticipantCommand): Promise<Result<Participant, Error>> {
    const { participantId, muted, mutedBy } = command;

    // Get target participant
    const targetResult = await this.participantRepository.getParticipant(participantId);
    if (targetResult.isFailure) {
      return failure(targetResult.error);
    }
    if (!targetResult.value) {
      return failure(new Error('Participant not found'));
    }

    const target = targetResult.value;

    // Get muter to check permissions
    const muterResult = await this.participantRepository.getParticipant(mutedBy);
    if (muterResult.isFailure) {
      return failure(muterResult.error);
    }
    if (!muterResult.value) {
      return failure(new Error('Muter not found'));
    }

    const muter = muterResult.value;

    // Check permissions (can mute self or others if privileged)
    if (participantId !== mutedBy && !canMuteOthers(muter.role)) {
      return failure(new Error('Insufficient role to mute others'));
    }

    // Mute participant
    const result = await this.participantRepository.muteParticipant(participantId, muted);
    if (result.isFailure) {
      return failure(result.error);
    }

    const participant = result.value;

    // Publish ParticipantMutedEvent
    this.eventBus.publish(
      buildEvent('ParticipantMuted', '@aimeetx/sdk/meeting', {
        meetingId: target.meetingId,
        participantId,
        muted,
        mutedBy: participantId !== mutedBy ? mutedBy : null,
        mutedAt: new Date().toISOString(),
      }),
    );

    return success(participant);
  }
}

// ============================================================================
// ChangeParticipantRoleUseCase
// ============================================================================

/**
 * Command for ChangeParticipantRoleUseCase.
 */
export interface ChangeParticipantRoleCommand {
  readonly participantId: ParticipantId;
  readonly newRole: ParticipantRole;
  readonly changedBy: ParticipantId;
}

/**
 * ChangeParticipantRoleUseCase — changes a participant's role.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: only host/co-host can change roles.
 */
@injectable()
export class ChangeParticipantRoleUseCase
  implements UseCase<ChangeParticipantRoleCommand, Participant, Error>
{
  constructor(
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ChangeParticipantRoleCommand,
  ): Promise<Result<Participant, Error>> {
    const { participantId, newRole, changedBy } = command;

    // Get target participant
    const targetResult = await this.participantRepository.getParticipant(participantId);
    if (targetResult.isFailure) {
      return failure(targetResult.error);
    }
    if (!targetResult.value) {
      return failure(new Error('Participant not found'));
    }

    const target = targetResult.value;

    // Get changer to check permissions
    const changerResult = await this.participantRepository.getParticipant(changedBy);
    if (changerResult.isFailure) {
      return failure(changerResult.error);
    }
    if (!changerResult.value) {
      return failure(new Error('Changer not found'));
    }

    const changer = changerResult.value;

    // Check permissions
    if (!canManageRoles(changer.role)) {
      return failure(new Error('Insufficient role to manage roles'));
    }

    const previousRole = target.role;

    // Change role
    const result = await this.participantRepository.updateParticipantRole(participantId, newRole);
    if (result.isFailure) {
      return failure(result.error);
    }

    const participant = result.value;

    // Publish ParticipantRoleChangedEvent
    this.eventBus.publish(
      buildEvent('ParticipantRoleChanged', '@aimeetx/sdk/meeting', {
        meetingId: target.meetingId,
        participantId,
        previousRole,
        newRole,
        changedBy,
        changedAt: new Date().toISOString(),
      }),
    );

    return success(participant);
  }
}

// ============================================================================
// RaiseHandUseCase
// ============================================================================

/**
 * Command for RaiseHandUseCase.
 */
export interface RaiseHandCommand {
  readonly participantId: ParticipantId;
}

/**
 * RaiseHandUseCase — raises a participant's hand.
 *
 * Per `feature-meeting/permissions/SPECIFICATION.md`: any participant can raise hand.
 */
@injectable()
export class RaiseHandUseCase implements UseCase<RaiseHandCommand, Participant, Error> {
  constructor(
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RaiseHandCommand): Promise<Result<Participant, Error>> {
    const { participantId } = command;

    // Get participant
    const participantResult = await this.participantRepository.getParticipant(participantId);
    if (participantResult.isFailure) {
      return failure(participantResult.error);
    }
    if (!participantResult.value) {
      return failure(new Error('Participant not found'));
    }

    const participant = participantResult.value;

    // Raise hand
    const result = await this.participantRepository.updateParticipantHandRaised(
      participantId,
      true,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish ParticipantHandRaisedEvent
    this.eventBus.publish(
      buildEvent('ParticipantHandRaised', '@aimeetx/sdk/meeting', {
        meetingId: participant.meetingId,
        participantId,
        displayName: participant.displayName,
        raisedAt: new Date().toISOString(),
      }),
    );

    return success(result.value);
  }
}

// ============================================================================
// LowerHandUseCase
// ============================================================================

/**
 * Command for LowerHandUseCase.
 */
export interface LowerHandCommand {
  readonly participantId: ParticipantId;
  readonly loweredBy: ParticipantId;
}

/**
 * LowerHandUseCase — lowers a participant's hand.
 *
 * Per `feature-meeting/permissions/SPECIFICATION.md`: participant or privileged role can lower.
 */
@injectable()
export class LowerHandUseCase implements UseCase<LowerHandCommand, Participant, Error> {
  constructor(
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LowerHandCommand): Promise<Result<Participant, Error>> {
    const { participantId, loweredBy } = command;

    // Get participant
    const participantResult = await this.participantRepository.getParticipant(participantId);
    if (participantResult.isFailure) {
      return failure(participantResult.error);
    }
    if (!participantResult.value) {
      return failure(new Error('Participant not found'));
    }

    const participant = participantResult.value;

    // If someone else is lowering, check permissions
    if (participantId !== loweredBy) {
      const lowererResult = await this.participantRepository.getParticipant(loweredBy);
      if (lowererResult.isFailure) {
        return failure(lowererResult.error);
      }
      if (!lowererResult.value) {
        return failure(new Error('Lowerer not found'));
      }
      if (!canMuteOthers(lowererResult.value.role)) {
        return failure(new Error('Insufficient role to lower others hands'));
      }
    }

    // Lower hand
    const result = await this.participantRepository.updateParticipantHandRaised(
      participantId,
      false,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish ParticipantHandLoweredEvent
    this.eventBus.publish(
      buildEvent('ParticipantHandLowered', '@aimeetx/sdk/meeting', {
        meetingId: participant.meetingId,
        participantId,
        loweredBy,
        loweredAt: new Date().toISOString(),
      }),
    );

    return success(result.value);
  }
}

// ============================================================================
// ListParticipantsUseCase
// ============================================================================

/**
 * Command for ListParticipantsUseCase.
 */
export interface ListParticipantsCommand {
  readonly meetingId: MeetingId;
}

/**
 * ListParticipantsUseCase — lists all participants in a meeting.
 */
@injectable()
export class ListParticipantsUseCase
  implements UseCase<ListParticipantsCommand, ReadonlyArray<Participant>, Error>
{
  constructor(
    @inject(TOKENS.ParticipantRepository)
    private readonly participantRepository: ParticipantRepository,
  ) {}

  async execute(
    command: ListParticipantsCommand,
  ): Promise<Result<ReadonlyArray<Participant>, Error>> {
    const result = await this.participantRepository.listParticipants(command.meetingId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// ListMeetingsUseCase
// ============================================================================

/**
 * Command for ListMeetingsUseCase.
 */
export interface ListMeetingsCommand {
  readonly hostId: UserId;
}

/**
 * ListMeetingsUseCase — lists meetings for a host.
 */
@injectable()
export class ListMeetingsUseCase
  implements UseCase<ListMeetingsCommand, ReadonlyArray<Meeting>, Error>
{
  constructor(
    @inject(TOKENS.MeetingRepository)
    private readonly meetingRepository: MeetingRepository,
  ) {}

  async execute(command: ListMeetingsCommand): Promise<Result<ReadonlyArray<Meeting>, Error>> {
    const result = await this.meetingRepository.listMeetingsByHost(command.hostId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}