import type { DomainEvent, IsoDateString, MeetingId, ParticipantId, UserId } from '@aimeetx/types';

import type {
  ConnectionState,
  NetworkQuality,
  ParticipantRole,
  RoomSettings,
  RSVPStatus,
  WaitingRoomPolicy,
} from '../model/meeting.js';

// ============================================================================
// Meeting Lifecycle Events
// ============================================================================

/**
 * MeetingCreatedEvent — published when a new meeting is created.
 *
 * Per `feature-meeting/lifecycle/EVENTS.md`: triggered after meeting creation.
 */
export interface MeetingCreatedEvent extends DomainEvent {
  readonly eventType: 'MeetingCreated';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly title: string;
    readonly hostId: UserId;
    readonly status: string;
    readonly createdAt: IsoDateString;
  };
}

/**
 * MeetingStartedEvent — published when a meeting transitions to ACTIVE.
 *
 * Per `feature-meeting/lifecycle/EVENTS.md`: triggered when host starts the meeting.
 */
export interface MeetingStartedEvent extends DomainEvent {
  readonly eventType: 'MeetingStarted';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly startedAt: IsoDateString;
    readonly startedBy: UserId;
  };
}

/**
 * MeetingEndedEvent — published when a meeting transitions to ENDED.
 *
 * Per `feature-meeting/lifecycle/EVENTS.md`: triggered when meeting ends.
 */
export interface MeetingEndedEvent extends DomainEvent {
  readonly eventType: 'MeetingEnded';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly endedAt: IsoDateString;
    readonly endedBy: UserId;
    readonly reason: 'host_ended' | 'scheduled_end' | 'timeout';
  };
}

/**
 * MeetingUpdatedEvent — published when meeting details are updated.
 *
 * Per `feature-meeting/lifecycle/EVENTS.md`: triggered after meeting update.
 */
export interface MeetingUpdatedEvent extends DomainEvent {
  readonly eventType: 'MeetingUpdated';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly updatedFields: ReadonlyArray<string>;
    readonly updatedAt: IsoDateString;
    readonly updatedBy: UserId;
  };
}

// ============================================================================
// Participant Events
// ============================================================================

/**
 * ParticipantJoinedEvent — published when a participant joins a meeting.
 *
 * Per `feature-meeting/participants/EVENTS.md`: triggered after participant joins.
 */
export interface ParticipantJoinedEvent extends DomainEvent {
  readonly eventType: 'ParticipantJoined';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly userId: UserId | null;
    readonly displayName: string;
    readonly role: ParticipantRole;
    readonly joinedAt: IsoDateString;
  };
}

/**
 * ParticipantLeftEvent — published when a participant leaves a meeting.
 *
 * Per `feature-meeting/participants/EVENTS.md`: triggered after participant leaves.
 */
export interface ParticipantLeftEvent extends DomainEvent {
  readonly eventType: 'ParticipantLeft';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly leftAt: IsoDateString;
    readonly reason: 'voluntary' | 'removed' | 'disconnected';
  };
}

/**
 * ParticipantRoleChangedEvent — published when a participant's role changes.
 *
 * Per `feature-meeting/participants/EVENTS.md`: triggered after role change.
 */
export interface ParticipantRoleChangedEvent extends DomainEvent {
  readonly eventType: 'ParticipantRoleChanged';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly previousRole: ParticipantRole;
    readonly newRole: ParticipantRole;
    readonly changedBy: ParticipantId;
    readonly changedAt: IsoDateString;
  };
}

/**
 * ParticipantMutedEvent — published when a participant is muted.
 *
 * Per `feature-meeting/participants/EVENTS.md`: triggered after mute action.
 */
export interface ParticipantMutedEvent extends DomainEvent {
  readonly eventType: 'ParticipantMuted';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly muted: boolean;
    readonly mutedBy: ParticipantId | null;
    readonly mutedAt: IsoDateString;
  };
}

/**
 * ParticipantHandRaisedEvent — published when a participant raises their hand.
 *
 * Per `feature-meeting/permissions/EVENTS.md`: triggered after hand raise.
 */
export interface ParticipantHandRaisedEvent extends DomainEvent {
  readonly eventType: 'ParticipantHandRaised';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly displayName: string;
    readonly raisedAt: IsoDateString;
  };
}

/**
 * ParticipantHandLoweredEvent — published when a participant lowers their hand.
 *
 * Per `feature-meeting/permissions/EVENTS.md`: triggered after hand lower.
 */
export interface ParticipantHandLoweredEvent extends DomainEvent {
  readonly eventType: 'ParticipantHandLowered';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly loweredBy: ParticipantId;
    readonly loweredAt: IsoDateString;
  };
}

// ============================================================================
// Room Events
// ============================================================================

/**
 * RoomCreatedEvent — published when a LiveKit room is created.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after room creation.
 */
export interface RoomCreatedEvent extends DomainEvent {
  readonly eventType: 'RoomCreated';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly livekitRoomName: string;
    readonly settings: RoomSettings;
    readonly createdAt: IsoDateString;
  };
}

/**
 * RoomDestroyedEvent — published when a LiveKit room is destroyed.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after room destruction.
 */
export interface RoomDestroyedEvent extends DomainEvent {
  readonly eventType: 'RoomDestroyed';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly livekitRoomName: string;
    readonly destroyedAt: IsoDateString;
    readonly reason: 'meeting_ended' | 'host_action' | 'system_cleanup';
  };
}

/**
 * RoomLockedEvent — published when the host locks the room.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after room lock.
 */
export interface RoomLockedEvent extends DomainEvent {
  readonly eventType: 'RoomLocked';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly lockedBy: ParticipantId;
    readonly lockedAt: IsoDateString;
  };
}

/**
 * RoomUnlockedEvent — published when the host unlocks the room.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after room unlock.
 */
export interface RoomUnlockedEvent extends DomainEvent {
  readonly eventType: 'RoomUnlocked';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly unlockedBy: ParticipantId;
    readonly unlockedAt: IsoDateString;
  };
}

/**
 * RoomMutedAllEvent — published when the host mutes all participants.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after mute all.
 */
export interface RoomMutedAllEvent extends DomainEvent {
  readonly eventType: 'RoomMutedAll';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly mutedBy: ParticipantId;
    readonly mutedCount: number;
    readonly mutedAt: IsoDateString;
  };
}

/**
 * RoomVideoDisabledEvent — published when the host disables all video.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after video disable.
 */
export interface RoomVideoDisabledEvent extends DomainEvent {
  readonly eventType: 'RoomVideoDisabled';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly disabledBy: ParticipantId;
    readonly disabledAt: IsoDateString;
  };
}

/**
 * RoomSettingsChangedEvent — published when room settings change.
 *
 * Per `feature-meeting/room/EVENTS.md`: triggered after settings change.
 */
export interface RoomSettingsChangedEvent extends DomainEvent {
  readonly eventType: 'RoomSettingsChanged';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly roomId: string;
    readonly changedBy: ParticipantId;
    readonly changedAt: IsoDateString;
  };
}

// ============================================================================
// Permission Events
// ============================================================================

/**
 * GlobalPermissionsChangedEvent — published when global permissions change.
 *
 * Per `feature-meeting/permissions/EVENTS.md`: triggered after permission update.
 */
export interface GlobalPermissionsChangedEvent extends DomainEvent {
  readonly eventType: 'GlobalPermissionsChanged';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly lockAttendeeAudio: boolean;
    readonly lockAttendeeVideo: boolean;
    readonly lockAttendeeChat: boolean;
    readonly allowAttendeeScreenShare: boolean;
    readonly waitingRoomPolicy: WaitingRoomPolicy;
    readonly changedBy: ParticipantId;
    readonly changedAt: IsoDateString;
  };
}

/**
 * SpeakPermissionGrantedEvent — published when speak permission is granted.
 *
 * Per `feature-meeting/permissions/EVENTS.md`: triggered after speak grant.
 */
export interface SpeakPermissionGrantedEvent extends DomainEvent {
  readonly eventType: 'SpeakPermissionGranted';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly grantedBy: ParticipantId;
    readonly grantedAt: IsoDateString;
  };
}

/**
 * SpeakPermissionRevokedEvent — published when speak permission is revoked.
 *
 * Per `feature-meeting/permissions/EVENTS.md`: triggered after speak revoke.
 */
export interface SpeakPermissionRevokedEvent extends DomainEvent {
  readonly eventType: 'SpeakPermissionRevoked';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly revokedBy: ParticipantId;
    readonly revokedAt: IsoDateString;
  };
}

// ============================================================================
// Waiting Room Events
// ============================================================================

/**
 * WaitingRoomEnteredEvent — published when a participant enters the waiting room.
 *
 * Per `feature-meeting/waiting-room/EVENTS.md`: triggered after knock.
 */
export interface WaitingRoomEnteredEvent extends DomainEvent {
  readonly eventType: 'WaitingRoomEntered';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly entryId: string;
    readonly participantId: ParticipantId;
    readonly displayName: string;
    readonly requestedAt: IsoDateString;
  };
}

/**
 * WaitingRoomAdmittedEvent — published when a participant is admitted from waiting room.
 *
 * Per `feature-meeting/waiting-room/EVENTS.md`: triggered after admission.
 */
export interface WaitingRoomAdmittedEvent extends DomainEvent {
  readonly eventType: 'WaitingRoomAdmitted';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly entryId: string;
    readonly participantId: ParticipantId;
    readonly admittedBy: ParticipantId;
    readonly admittedAt: IsoDateString;
  };
}

/**
 * WaitingRoomDeniedEvent — published when a participant is denied from waiting room.
 *
 * Per `feature-meeting/waiting-room/EVENTS.md`: triggered after denial.
 */
export interface WaitingRoomDeniedEvent extends DomainEvent {
  readonly eventType: 'WaitingRoomDenied';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly entryId: string;
    readonly participantId: ParticipantId;
    readonly deniedBy: ParticipantId;
    readonly reason: string | null;
    readonly deniedAt: IsoDateString;
  };
}

// ============================================================================
// Invitation Events
// ============================================================================

/**
 * InvitationCreatedEvent — published when an invitation is created.
 *
 * Per `feature-meeting/invitations/EVENTS.md`: triggered after invitation creation.
 */
export interface InvitationCreatedEvent extends DomainEvent {
  readonly eventType: 'InvitationCreated';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly invitationId: string;
    readonly inviteeEmail: string;
    readonly inviteeName: string | null;
    readonly inviteeRole: ParticipantRole;
    readonly expiresAt: IsoDateString;
    readonly invitedBy: UserId;
  };
}

/**
 * InvitationRsvpUpdatedEvent — published when an invitee responds.
 *
 * Per `feature-meeting/invitations/EVENTS.md`: triggered after RSVP update.
 */
export interface InvitationRsvpUpdatedEvent extends DomainEvent {
  readonly eventType: 'InvitationRsvpUpdated';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly invitationId: string;
    readonly inviteeEmail: string;
    readonly status: RSVPStatus;
    readonly respondedAt: IsoDateString;
  };
}

/**
 * InvitationRevokedEvent — published when an invitation is revoked.
 *
 * Per `feature-meeting/invitations/EVENTS.md`: triggered after revocation.
 */
export interface InvitationRevokedEvent extends DomainEvent {
  readonly eventType: 'InvitationRevoked';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly invitationId: string;
    readonly inviteeEmail: string;
    readonly revokedBy: UserId;
    readonly revokedAt: IsoDateString;
  };
}

// ============================================================================
// Scheduling Events
// ============================================================================

/**
 * MeetingScheduledEvent — published when a meeting is scheduled.
 *
 * Per `feature-meeting/scheduling/EVENTS.md`: triggered after scheduling.
 */
export interface MeetingScheduledEvent extends DomainEvent {
  readonly eventType: 'MeetingScheduled';
  readonly payload: {
    readonly scheduleId: string;
    readonly meetingId: MeetingId;
    readonly title: string;
    readonly startTime: IsoDateString;
    readonly durationMinutes: number;
    readonly timezoneId: string;
    readonly seriesId: string | null;
    readonly creatorId: UserId;
    readonly scheduledAt: IsoDateString;
  };
}

/**
 * MeetingRescheduledEvent — published when a meeting is rescheduled.
 *
 * Per `feature-meeting/scheduling/EVENTS.md`: triggered after reschedule.
 */
export interface MeetingRescheduledEvent extends DomainEvent {
  readonly eventType: 'MeetingRescheduled';
  readonly payload: {
    readonly scheduleId: string;
    readonly meetingId: MeetingId;
    readonly previousStartTime: IsoDateString;
    readonly newStartTime: IsoDateString;
    readonly previousDurationMinutes: number;
    readonly newDurationMinutes: number;
    readonly rescheduledBy: UserId;
    readonly rescheduledAt: IsoDateString;
  };
}

/**
 * MeetingCancelledEvent — published when a scheduled meeting is cancelled.
 *
 * Per `feature-meeting/scheduling/EVENTS.md`: triggered after cancellation.
 */
export interface MeetingCancelledEvent extends DomainEvent {
  readonly eventType: 'MeetingCancelled';
  readonly payload: {
    readonly scheduleId: string;
    readonly meetingId: MeetingId;
    readonly title: string;
    readonly cancelledBy: UserId;
    readonly reason: string | null;
    readonly cancelledAt: IsoDateString;
  };
}

/**
 * MeetingReminderTriggeredEvent — published when a reminder is triggered.
 *
 * Per `feature-meeting/scheduling/EVENTS.md`: triggered at reminder time.
 */
export interface MeetingReminderTriggeredEvent extends DomainEvent {
  readonly eventType: 'MeetingReminderTriggered';
  readonly payload: {
    readonly scheduleId: string;
    readonly meetingId: MeetingId;
    readonly title: string;
    readonly channel: 'push' | 'email' | 'sms';
    readonly triggerOffsetMinutes: number;
    readonly triggeredAt: IsoDateString;
  };
}

// ============================================================================
// Presence Events
// ============================================================================

/**
 * ParticipantPresenceChangedEvent — published when presence state changes.
 *
 * Per `feature-meeting/presence/EVENTS.md`: triggered after state change.
 */
export interface ParticipantPresenceChangedEvent extends DomainEvent {
  readonly eventType: 'ParticipantPresenceChanged';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly previousState: ConnectionState;
    readonly newState: ConnectionState;
    readonly networkQuality: NetworkQuality;
    readonly changedAt: IsoDateString;
  };
}

/**
 * ActiveSpeakerChangedEvent — published when the active speaker changes.
 *
 * Per `feature-meeting/presence/EVENTS.md`: triggered after speaker change.
 */
export interface ActiveSpeakerChangedEvent extends DomainEvent {
  readonly eventType: 'ActiveSpeakerChanged';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly previousSpeakerId: ParticipantId | null;
    readonly newSpeakerId: ParticipantId;
    readonly audioLevel: number;
    readonly detectedAt: IsoDateString;
  };
}

/**
 * NetworkQualityDegradedEvent — published when network quality drops.
 *
 * Per `feature-meeting/presence/EVENTS.md`: triggered on quality degradation.
 */
export interface NetworkQualityDegradedEvent extends DomainEvent {
  readonly eventType: 'NetworkQualityDegraded';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly previousQuality: NetworkQuality;
    readonly currentQuality: NetworkQuality;
    readonly latencyMs: number;
    readonly packetLossPercent: number;
    readonly detectedAt: IsoDateString;
  };
}

// ============================================================================
// Event Union Types
// ============================================================================

/**
 * Union of all meeting lifecycle events.
 */
export type MeetingLifecycleEvent =
  | MeetingCreatedEvent
  | MeetingStartedEvent
  | MeetingEndedEvent
  | MeetingUpdatedEvent;

/**
 * Union of all participant events.
 */
export type ParticipantEvent =
  | ParticipantJoinedEvent
  | ParticipantLeftEvent
  | ParticipantRoleChangedEvent
  | ParticipantMutedEvent
  | ParticipantHandRaisedEvent
  | ParticipantHandLoweredEvent;

/**
 * Union of all room events.
 */
export type RoomEvent =
  | RoomCreatedEvent
  | RoomDestroyedEvent
  | RoomLockedEvent
  | RoomUnlockedEvent
  | RoomMutedAllEvent
  | RoomVideoDisabledEvent
  | RoomSettingsChangedEvent;

/**
 * Union of all permission events.
 */
export type PermissionEvent =
  | GlobalPermissionsChangedEvent
  | SpeakPermissionGrantedEvent
  | SpeakPermissionRevokedEvent;

/**
 * Union of all waiting room events.
 */
export type WaitingRoomEvent =
  | WaitingRoomEnteredEvent
  | WaitingRoomAdmittedEvent
  | WaitingRoomDeniedEvent;

/**
 * Union of all invitation events.
 */
export type InvitationEvent =
  | InvitationCreatedEvent
  | InvitationRsvpUpdatedEvent
  | InvitationRevokedEvent;

/**
 * Union of all scheduling events.
 */
export type SchedulingEvent =
  | MeetingScheduledEvent
  | MeetingRescheduledEvent
  | MeetingCancelledEvent
  | MeetingReminderTriggeredEvent;

/**
 * Union of all presence events.
 */
export type PresenceEvent =
  | ParticipantPresenceChangedEvent
  | ActiveSpeakerChangedEvent
  | NetworkQualityDegradedEvent;

/**
 * Union of all meeting-related domain events.
 */
export type MeetingEvent =
  | MeetingLifecycleEvent
  | ParticipantEvent
  | RoomEvent
  | PermissionEvent
  | WaitingRoomEvent
  | InvitationEvent
  | SchedulingEvent
  | PresenceEvent;