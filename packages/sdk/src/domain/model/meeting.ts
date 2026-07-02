import type { IsoDateString, MeetingId, ParticipantId, UserId } from '@aimeetx/types';

// ============================================================================
// Meeting Status
// ============================================================================

/**
 * Meeting status.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: meeting state machine values.
 * States: SCHEDULED → WAITING → ACTIVE → PAUSED → ENDED
 */
export type MeetingStatus = 'scheduled' | 'waiting' | 'active' | 'paused' | 'ended';

// ============================================================================
// Participant Role
// ============================================================================

/**
 * Participant role.
 *
 * Per `feature-meeting/shared/SPECIFICATION.md`: role hierarchy.
 * HOST > CO_HOST > MODERATOR > SPEAKER > ATTENDEE
 */
export type ParticipantRole = 'host' | 'co_host' | 'moderator' | 'speaker' | 'attendee';

/**
 * Check if a role can mute others.
 */
export function canMuteOthers(role: ParticipantRole): boolean {
  return role === 'host' || role === 'co_host' || role === 'moderator';
}

/**
 * Check if a role can manage other roles.
 */
export function canManageRoles(role: ParticipantRole): boolean {
  return role === 'host' || role === 'co_host';
}

/**
 * Check if a role can admit others from waiting room.
 */
export function canAdmitOthers(role: ParticipantRole): boolean {
  return role === 'host' || role === 'co_host' || role === 'moderator';
}

/**
 * Check if a role can kick others.
 */
export function canKickOthers(role: ParticipantRole): boolean {
  return role === 'host' || role === 'co_host' || role === 'moderator';
}

/**
 * Check if a role is privileged (host or co-host).
 */
export function isPrivilegedRole(role: ParticipantRole): boolean {
  return role === 'host' || role === 'co_host';
}

// ============================================================================
// Participant Status
// ============================================================================

/**
 * Participant status.
 *
 * Per `feature-meeting/shared/SPECIFICATION.md`: participant state values.
 */
export type ParticipantStatus =
  | 'waiting'
  | 'active'
  | 'muted'
  | 'on_hold'
  | 'left'
  | 'removed'
  | 'disconnected';

// ============================================================================
// Permission Flag
// ============================================================================

/**
 * Permission flags for fine-grained access control.
 *
 * Per `feature-meeting/permissions/SPECIFICATION.md`: permission flag values.
 */
export type PermissionFlag =
  | 'publish_audio'
  | 'publish_video'
  | 'share_screen'
  | 'send_chat'
  | 'mute_others'
  | 'admit_others'
  | 'kick_others'
  | 'manage_roles';

// ============================================================================
// Connection State (Presence)
// ============================================================================

/**
 * Connection state for presence tracking.
 *
 * Per `feature-meeting/presence/SPECIFICATION.md`: connection state values.
 */
export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

/**
 * Network quality levels.
 *
 * Per `feature-meeting/presence/SPECIFICATION.md`: network quality values.
 */
export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

// ============================================================================
// Room Status
// ============================================================================

/**
 * Room status.
 *
 * Per `feature-meeting/room/SPECIFICATION.md`: room status values.
 */
export type RoomStatus = 'creating' | 'active' | 'locked' | 'ended';

// ============================================================================
// Waiting Room Resolution
// ============================================================================

/**
 * Waiting room entry resolution status.
 *
 * Per `feature-meeting/waiting-room/SPECIFICATION.md`: resolution status values.
 */
export type ResolutionStatus = 'waiting' | 'admitted' | 'denied';

// ============================================================================
// RSVP Status
// ============================================================================

/**
 * RSVP status for invitations.
 *
 * Per `feature-meeting/invitations/SPECIFICATION.md`: RSVP status values.
 */
export type RSVPStatus = 'pending' | 'accepted' | 'declined' | 'expired';

// ============================================================================
// Schedule Status
// ============================================================================

/**
 * Schedule status.
 *
 * Per `feature-meeting/scheduling/SPECIFICATION.md`: schedule status values.
 */
export type ScheduleStatus = 'scheduled' | 'cancelled' | 'completed';

// ============================================================================
// Recurrence Frequency
// ============================================================================

/**
 * Recurrence frequency for scheduled meetings.
 *
 * Per `feature-meeting/scheduling/SPECIFICATION.md`: recurrence frequency values.
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

// ============================================================================
// Waiting Room Policy
// ============================================================================

/**
 * Waiting room policy.
 *
 * Per `feature-meeting/permissions/SPECIFICATION.md`: waiting room policy values.
 */
export type WaitingRoomPolicy = 'everyone' | 'authenticated_users' | 'invited_guests' | 'none';

// ============================================================================
// Audio Quality
// ============================================================================

/**
 * Audio quality settings.
 *
 * Per `feature-meeting/room/SPECIFICATION.md`: audio quality values.
 */
export type AudioQuality = 'economy' | 'standard' | 'high';

// ============================================================================
// Meeting (Aggregate Root)
// ============================================================================

/**
 * Meeting aggregate root.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: Meeting is the root entity.
 */
export interface Meeting {
  readonly id: MeetingId;
  readonly title: string;
  readonly description: string | null;
  readonly hostId: UserId;
  readonly status: MeetingStatus;
  readonly passcode: string | null;
  readonly maxParticipants: number;
  readonly settings: MeetingSettings;
  readonly livekitRoomName: string | null;
  readonly startedAt: IsoDateString | null;
  readonly endedAt: IsoDateString | null;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * Meeting settings.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: configurable meeting options.
 */
export interface MeetingSettings {
  readonly waitingRoomEnabled: boolean;
  readonly muteOnEntry: boolean;
  readonly videoOnEntry: boolean;
  readonly allowRecording: boolean;
  readonly allowTranscription: boolean;
  readonly chatEnabled: boolean;
  readonly handRaiseEnabled: boolean;
  readonly breakoutRoomsEnabled: boolean;
}

/**
 * Default meeting settings.
 */
export const DEFAULT_MEETING_SETTINGS: MeetingSettings = {
  waitingRoomEnabled: false,
  muteOnEntry: true,
  videoOnEntry: true,
  allowRecording: true,
  allowTranscription: false,
  chatEnabled: true,
  handRaiseEnabled: true,
  breakoutRoomsEnabled: false,
} as const;

// ============================================================================
// Participant
// ============================================================================

/**
 * Meeting participant.
 *
 * Per `feature-meeting/participants/SPECIFICATION.md`: participant entity.
 */
export interface Participant {
  readonly id: ParticipantId;
  readonly meetingId: MeetingId;
  readonly userId: UserId | null;
  readonly displayName: string;
  readonly role: ParticipantRole;
  readonly status: ParticipantStatus;
  readonly isMuted: boolean;
  readonly isVideoOn: boolean;
  readonly isScreenSharing: boolean;
  readonly isHandRaised: boolean;
  readonly joinedAt: IsoDateString;
  readonly leftAt: IsoDateString | null;
}

// ============================================================================
// Meeting Room
// ============================================================================

/**
 * Meeting room (LiveKit integration).
 *
 * Per `feature-meeting/room/SPECIFICATION.md`: room entity.
 */
export interface MeetingRoom {
  readonly id: string;
  readonly meetingId: MeetingId;
  readonly livekitRoomName: string;
  readonly status: RoomStatus;
  readonly settings: RoomSettings;
  readonly createdAt: IsoDateString;
  readonly destroyedAt: IsoDateString | null;
}

/**
 * Room settings.
 *
 * Per `feature-meeting/room/SPECIFICATION.md`: room configuration.
 */
export interface RoomSettings {
  readonly maxParticipants: number;
  readonly isLocked: boolean;
  readonly isMuteAllEnabled: boolean;
  readonly isVideoDisabled: boolean;
  readonly allowMultipleScreenShares: boolean;
  readonly maxVideoBitrateKbps: number;
  readonly audioQuality: AudioQuality;
}

/**
 * Default room settings.
 */
export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  maxParticipants: 100,
  isLocked: false,
  isMuteAllEnabled: false,
  isVideoDisabled: false,
  allowMultipleScreenShares: false,
  maxVideoBitrateKbps: 2500,
  audioQuality: 'standard',
} as const;

// ============================================================================
// Meeting Permissions
// ============================================================================

/**
 * Meeting permissions (global lockout configuration).
 *
 * Per `feature-meeting/permissions/SPECIFICATION.md`: permissions entity.
 */
export interface MeetingPermissions {
  readonly meetingId: MeetingId;
  readonly lockAttendeeAudio: boolean;
  readonly lockAttendeeVideo: boolean;
  readonly lockAttendeeChat: boolean;
  readonly allowAttendeeScreenShare: boolean;
  readonly waitingRoomPolicy: WaitingRoomPolicy;
  readonly updatedBy: ParticipantId | null;
  readonly updatedAt: IsoDateString;
}

/**
 * Participant permission override.
 *
 * Per `feature-meeting/permissions/SPECIFICATION.md`: individual permission overrides.
 */
export interface ParticipantPermissionOverride {
  readonly id: string;
  readonly meetingId: MeetingId;
  readonly participantId: ParticipantId;
  readonly allowedPermissions: ReadonlyArray<PermissionFlag>;
  readonly deniedPermissions: ReadonlyArray<PermissionFlag>;
  readonly isHandRaised: boolean;
  readonly handRaisedAt: IsoDateString | null;
  readonly speakPermissionGrantedAt: IsoDateString | null;
}

// ============================================================================
// Waiting Room Entry
// ============================================================================

/**
 * Waiting room entry.
 *
 * Per `feature-meeting/waiting-room/SPECIFICATION.md`: waiting room entity.
 */
export interface WaitingRoomEntry {
  readonly id: string;
  readonly meetingId: MeetingId;
  readonly participantId: ParticipantId;
  readonly displayName: string;
  readonly requestedAt: IsoDateString;
  readonly resolvedAt: IsoDateString | null;
  readonly resolution: ResolutionStatus;
  readonly resolvedBy: ParticipantId | null;
}

// ============================================================================
// Meeting Invitation
// ============================================================================

/**
 * Meeting invitation.
 *
 * Per `feature-meeting/invitations/SPECIFICATION.md`: invitation entity.
 */
export interface MeetingInvitation {
  readonly id: string;
  readonly meetingId: MeetingId;
  readonly inviteeEmail: string;
  readonly inviteeName: string | null;
  readonly inviteeRole: ParticipantRole;
  readonly token: string;
  readonly status: RSVPStatus;
  readonly expiresAt: IsoDateString;
  readonly createdAt: IsoDateString;
  readonly respondedAt: IsoDateString | null;
}

// ============================================================================
// Scheduled Meeting
// ============================================================================

/**
 * Scheduled meeting.
 *
 * Per `feature-meeting/scheduling/SPECIFICATION.md`: schedule entity.
 */
export interface ScheduledMeeting {
  readonly id: string;
  readonly meetingId: MeetingId;
  readonly title: string;
  readonly description: string | null;
  readonly startTime: IsoDateString;
  readonly durationMinutes: number;
  readonly timezoneId: string;
  readonly recurrenceRule: RecurrenceRule | null;
  readonly seriesId: string | null;
  readonly status: ScheduleStatus;
  readonly reminderSettings: ReadonlyArray<ReminderSetting>;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * Recurrence rule (RFC 5545).
 *
 * Per `feature-meeting/scheduling/SPECIFICATION.md`: recurrence configuration.
 */
export interface RecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly count: number | null;
  readonly until: IsoDateString | null;
  readonly byDay: ReadonlyArray<string>;
}

/**
 * Reminder setting.
 *
 * Per `feature-meeting/scheduling/SPECIFICATION.md`: reminder configuration.
 */
export interface ReminderSetting {
  readonly triggerOffsetMinutes: number;
  readonly channel: 'push' | 'email' | 'sms';
}

// ============================================================================
// Participant Presence
// ============================================================================

/**
 * Participant presence (real-time connectivity and speaking state).
 *
 * Per `feature-meeting/presence/SPECIFICATION.md`: presence entity.
 */
export interface ParticipantPresence {
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly connectionState: ConnectionState;
  readonly networkQuality: NetworkQuality;
  readonly isSpeaking: boolean;
  readonly audioLevel: number;
  readonly lastHeartbeatAt: IsoDateString;
  readonly connectedAt: IsoDateString;
  readonly disconnectedAt: IsoDateString | null;
}

// ============================================================================
// Meeting Constraints
// ============================================================================

/**
 * Meeting constraints.
 *
 * Per `feature-meeting/lifecycle/SPECIFICATION.md`: meeting limits.
 */
export const MEETING_CONSTRAINTS = {
  MAX_TITLE_LENGTH: 256,
  MIN_TITLE_LENGTH: 1,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_PARTICIPANTS_DEFAULT: 100,
  MAX_PARTICIPANTS_LIMIT: 500,
  MIN_DURATION_MINUTES: 5,
  MAX_DURATION_MINUTES: 1440, // 24 hours
  PASSCODE_MIN_LENGTH: 4,
  PASSCODE_MAX_LENGTH: 32,
  INVITATION_TOKEN_LENGTH: 32,
  DISPLAY_NAME_MAX_LENGTH: 128,
  DISPLAY_NAME_MIN_LENGTH: 1,
} as const;

// ============================================================================
// Meeting Errors
// ============================================================================

/**
 * Meeting error types.
 *
 * Per feature-meeting API specifications: error codes.
 */
export type MeetingError =
  | { readonly code: 'MeetingNotFound'; readonly message: string }
  | { readonly code: 'MeetingAlreadyEnded'; readonly message: string }
  | { readonly code: 'MeetingCapacityExceeded'; readonly message: string; readonly capacity: number }
  | { readonly code: 'ParticipantNotFound'; readonly message: string }
  | { readonly code: 'InsufficientRole'; readonly message: string; readonly required: ParticipantRole; readonly actual: ParticipantRole }
  | { readonly code: 'PermissionDenied'; readonly message: string; readonly permission: PermissionFlag }
  | { readonly code: 'RoomAlreadyLocked'; readonly message: string }
  | { readonly code: 'RoomNotFound'; readonly message: string }
  | { readonly code: 'InvitationNotFound'; readonly message: string }
  | { readonly code: 'InvitationExpired'; readonly message: string }
  | { readonly code: 'InvalidPasscode'; readonly message: string }
  | { readonly code: 'InvalidStartTime'; readonly message: string }
  | { readonly code: 'InvalidTimezone'; readonly message: string }
  | { readonly code: 'WaitingRoomEntryNotFound'; readonly message: string }
  | { readonly code: 'AlreadyResolved'; readonly message: string }
  | { readonly code: 'Unauthorized'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'ServerError'; readonly message: string; readonly status?: number }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };