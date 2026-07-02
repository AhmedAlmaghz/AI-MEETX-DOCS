/**
 * @aimeetx/sdk — Public API surface.
 *
 * This is the entry point for all consumers (web, desktop, mobile, 3rd-party).
 * Per ADR-005: the SDK is the single source of truth for all business logic.
 */

// tsyringe requires reflect-metadata to be imported BEFORE any other code.
// This MUST be the first import in the SDK entry point.
import 'reflect-metadata';

// Domain layer
export type { UseCase } from './domain/use-case.js';
export type { User } from './domain/model/user.js';
export type { UserRepository } from './domain/port/user-repository.js';
export { GetCurrentUserUseCase, type GetCurrentUserCommand } from './domain/usecase/get-current-user.js';

// Auth domain
export type {
  AuthCredentials,
  RegisterInput,
  Session,
  SessionStatus,
  AuthError,
} from './domain/model/auth.js';
export type { AuthRepository } from './domain/port/auth-repository.js';
export type { SecureTokenStorage } from './domain/port/secure-token-storage.js';
export type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  SessionExpiredEvent,
  SessionRefreshedEvent,
  AuthEvent,
} from './domain/event/auth-events.js';
export {
  LoginWithEmailUseCase,
  RegisterWithEmailUseCase,
  LoginAsGuestUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
} from './domain/usecase/auth-use-cases.js';

// Profile domain
export type {
  Theme,
  UserRole,
  AccountStatus,
  Presence,
  ProfileVisibility,
  UserProfile,
  UserPreferences,
  NotificationSettings,
  PrivacySettings,
  AccessibilitySettings,
  ProfileError,
} from './domain/model/profile.js';
export { AVATAR_CONSTRAINTS } from './domain/model/profile.js';
export type {
  AvatarUpload,
  AvatarUploadResult,
  ProfileUpdate,
  ProfileRepository,
} from './domain/port/profile-repository.js';
export type {
  ProfileUpdatedEvent,
  AvatarUpdatedEvent,
  AvatarRemovedEvent,
  ThemeChangedEvent,
  LanguageChangedEvent,
  TranslationLanguageChangedEvent,
  NotificationSettingsUpdatedEvent,
  PrivacySettingsUpdatedEvent,
  AccessibilitySettingsUpdatedEvent,
  PresenceChangedEvent,
  AccountDeactivatedEvent,
  ProfileEvent,
} from './domain/event/profile-events.js';
export {
  GetProfileUseCase,
  type GetProfileCommand,
  UpdateProfileUseCase,
  type UpdateProfileCommand,
  UploadAvatarUseCase,
  type UploadAvatarCommand,
  DeleteAvatarUseCase,
  type DeleteAvatarCommand,
  UpdateLanguagePreferenceUseCase,
  type UpdateLanguagePreferenceCommand,
  UpdateThemeUseCase,
  type UpdateThemeCommand,
  UpdateNotificationSettingsUseCase,
  type UpdateNotificationSettingsCommand,
  UpdatePrivacySettingsUseCase,
  type UpdatePrivacySettingsCommand,
  UpdateAccessibilitySettingsUseCase,
  type UpdateAccessibilitySettingsCommand,
  UpdatePresenceUseCase,
  type UpdatePresenceCommand,
  DeactivateAccountUseCase,
  type DeactivateAccountCommand,
} from './domain/usecase/profile-use-cases.js';

// Meeting domain
export type {
  MeetingStatus,
  ParticipantRole,
  ParticipantStatus,
  PermissionFlag,
  ConnectionState,
  NetworkQuality,
  RoomStatus,
  ResolutionStatus,
  RSVPStatus,
  ScheduleStatus,
  RecurrenceFrequency,
  WaitingRoomPolicy,
  AudioQuality,
  Meeting,
  MeetingSettings,
  Participant,
  MeetingRoom,
  RoomSettings,
  MeetingPermissions,
  ParticipantPermissionOverride,
  WaitingRoomEntry,
  MeetingInvitation,
  ScheduledMeeting,
  RecurrenceRule,
  ReminderSetting,
  ParticipantPresence,
  MeetingError,
} from './domain/model/meeting.js';
export {
  DEFAULT_MEETING_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  MEETING_CONSTRAINTS,
  canMuteOthers,
  canManageRoles,
  canAdmitOthers,
  canKickOthers,
  isPrivilegedRole,
} from './domain/model/meeting.js';
export type {
  CreateMeetingInput,
  MeetingUpdate,
  MeetingRepository,
  JoinMeetingInput,
  ParticipantRepository,
} from './domain/port/meeting-repository.js';
export type {
  MeetingCreatedEvent,
  MeetingStartedEvent,
  MeetingEndedEvent,
  MeetingUpdatedEvent,
  ParticipantJoinedEvent,
  ParticipantLeftEvent,
  ParticipantRoleChangedEvent,
  ParticipantMutedEvent,
  ParticipantHandRaisedEvent,
  ParticipantHandLoweredEvent,
  RoomCreatedEvent,
  RoomDestroyedEvent,
  RoomLockedEvent,
  RoomUnlockedEvent,
  RoomMutedAllEvent,
  RoomVideoDisabledEvent,
  RoomSettingsChangedEvent,
  GlobalPermissionsChangedEvent,
  SpeakPermissionGrantedEvent,
  SpeakPermissionRevokedEvent,
  WaitingRoomEnteredEvent,
  WaitingRoomAdmittedEvent,
  WaitingRoomDeniedEvent,
  InvitationCreatedEvent,
  InvitationRsvpUpdatedEvent,
  InvitationRevokedEvent,
  MeetingScheduledEvent,
  MeetingRescheduledEvent,
  MeetingCancelledEvent,
  MeetingReminderTriggeredEvent,
  ParticipantPresenceChangedEvent,
  ActiveSpeakerChangedEvent,
  NetworkQualityDegradedEvent,
  MeetingLifecycleEvent,
  ParticipantEvent,
  RoomEvent,
  PermissionEvent,
  WaitingRoomEvent,
  InvitationEvent,
  SchedulingEvent,
  PresenceEvent,
  MeetingEvent,
} from './domain/event/meeting-events.js';
export {
  CreateMeetingUseCase,
  type CreateMeetingCommand,
  GetMeetingUseCase,
  type GetMeetingCommand,
  UpdateMeetingUseCase,
  type UpdateMeetingCommand,
  StartMeetingUseCase,
  type StartMeetingCommand,
  EndMeetingUseCase,
  type EndMeetingCommand,
  JoinMeetingUseCase,
  type JoinMeetingCommand,
  LeaveMeetingUseCase,
  type LeaveMeetingCommand,
  MuteParticipantUseCase,
  type MuteParticipantCommand,
  ChangeParticipantRoleUseCase,
  type ChangeParticipantRoleCommand,
  RaiseHandUseCase,
  type RaiseHandCommand,
  LowerHandUseCase,
  type LowerHandCommand,
  ListParticipantsUseCase,
  type ListParticipantsCommand,
  ListMeetingsUseCase,
  type ListMeetingsCommand,
} from './domain/usecase/meeting-use-cases.js';

// Data layer
export { HttpAuthRepository } from './data/http-auth-repository.js';
export { HttpProfileRepository } from './data/http-profile-repository.js';
export { WebSecureTokenStorage } from './data/web-secure-token-storage.js';

// DI
export { TOKENS, type Token } from './di/tokens.js';
export { initializeSdk, resetSdk, sdkContainer, type SdkConfig } from './di/container.js';
