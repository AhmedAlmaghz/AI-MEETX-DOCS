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

// Admin domain
export type {
  TenantId,
  TenantStatus,
  AdminRole,
  AuditLogAction,
  TenantFeatureFlags,
  Tenant,
  TenantMember,
  AuditLogEntry,
  AdminActorClaims,
} from './domain/model/admin.js';
export {
  DEFAULT_TENANT_FEATURE_FLAGS,
  FEATURE_FLAG_CACHE_TTL_MS,
  canManageTenants,
  canManageTenantSettings,
  canInviteTenantMembers,
  canQueryAuditLogs,
} from './domain/model/admin.js';
export type {
  CreateTenantInput,
  InviteTenantMemberInput,
  AuditLogQuery,
  TenantRepository,
  AuditLogRepository,
  FeatureFlagCache,
} from './domain/port/admin-repository.js';
export {
  CreateTenantUseCase,
  type CreateTenantCommand,
  SuspendTenantUseCase,
  type SuspendTenantCommand,
  UpdateFeatureFlagsUseCase,
  type UpdateFeatureFlagsCommand,
  GetTenantFeatureFlagsUseCase,
  type GetTenantFeatureFlagsCommand,
  QueryAuditLogUseCase,
  type QueryAuditLogCommand,
  InviteTenantMemberUseCase,
  type InviteTenantMemberCommand,
} from './domain/usecase/admin-use-cases.js';

// Analytics domain
export type {
  AnalyticsTenantId,
  AnalyticsGranularity,
  AnalyticsDateRange,
  MeetingFact,
  UserEngagementFact,
  TenantDailySummary,
  PlatformDailySummary,
  MeetingAnalyticsPoint,
  MeetingAnalyticsSummary,
  PlatformMetricsSummary,
  AnalyticsActorClaims,
  MeetingEndedAnalyticsPayload,
  RecordingReadyAnalyticsPayload,
  TranslationAnalyticsPayload,
} from './domain/model/analytics.js';
export {
  ANALYTICS_LIMITS,
  canReadTenantAnalytics,
  canReadPlatformAnalytics,
  toUtcDate,
  calculateDurationMinutes,
} from './domain/model/analytics.js';
export type {
  MeetingFactUpdate,
  MeetingFactRepository,
  UserEngagementRepository,
  AnalyticsSummaryRepository,
} from './domain/port/analytics-repository.js';
export {
  MeetingEndedConsumer,
  type ConsumeMeetingEndedCommand,
  RecordingReadyConsumer,
  type ConsumeRecordingReadyCommand,
  TranslationConsumer,
  type ConsumeTranslationCommand,
  RunAnalyticsAggregationJobUseCase,
  type RunAnalyticsAggregationCommand,
  GetMeetingAnalyticsUseCase,
  type GetMeetingAnalyticsCommand,
  GetPlatformMetricsUseCase,
  type GetPlatformMetricsCommand,
  ExportMeetingReportUseCase,
  type ExportMeetingReportCommand,
  AiReportConsumer,
  type MarkMeetingAiEnabledCommand,
} from './domain/usecase/analytics-use-cases.js';

// Media domain
export type {
  // Branded IDs
  MediaSessionId,
  AudioSessionId,
  VideoSessionId,
  NetworkSessionId,
  ScreenShareSessionId,
  OrchestrationSessionId,
  MediaPlatformSessionId,
  MediaDeviceId,
  AudioStreamId,
  FrameId,
  PeerId,
  // States
  MediaSessionState,
  TransportState,
  RecoveryState,
  AudioState,
  VideoState,
  NetworkConnectionState,
  StreamType,
  ScreenShareState,
  CaptureSource,
  DeviceType,
  DeviceState,
  GlobalMediaState,
  PlatformSessionState,
  SessionType,
  PlatformParticipantRole,
  MediaNetworkQuality,
  // Value Objects
  AudioQualityProfile,
  AudioMetrics,
  ResolutionProfile,
  FrameRateProfile,
  EncodingProfile,
  VideoMetrics,
  StreamDescriptor,
  NetworkMetrics,
  RoutingProfile,
  CaptureProfile,
  CaptureRegion,
  ScreenMetrics,
  DeviceCapabilities,
  SessionCapabilities,
  SubsystemHealthSnapshot,
  OrchestrationPolicy,
  SessionPolicy,
  ParticipantProfile,
  // Aggregate Roots
  MediaSession,
  AudioSession,
  VideoSession,
  NetworkSession,
  PeerConnectionState,
  ScreenShareSession,
  MediaDevice,
  MediaOrchestrationSession,
  SubsystemStates,
  MediaPlatformSession,
} from './domain/model/media.js';
export {
  MEDIA_CONSTRAINTS,
  DEFAULT_AUDIO_QUALITY,
  DEFAULT_VIDEO_RESOLUTION,
  DEFAULT_VIDEO_FRAME_RATE,
  DEFAULT_VIDEO_ENCODING,
  DEFAULT_ORCHESTRATION_POLICY,
  DEFAULT_SESSION_POLICY,
  isMediaSessionTerminal,
  isMediaSessionActive,
  isAudioTerminal,
  isVideoTerminal,
  isNetworkTerminal,
  isNetworkConnected,
  isScreenShareTerminal,
  isDeviceSelectable,
  isGlobalMediaTerminal,
  isPlatformSessionTerminal,
  isPlatformHost,
  canPlatformManage,
} from './domain/model/media.js';
export type {
  // Repository Inputs
  CreateMediaSessionInput,
  CreateAudioSessionInput,
  CreateVideoSessionInput,
  CreateNetworkSessionInput,
  CreateScreenShareSessionInput,
  CreateMediaDeviceInput,
  CreateOrchestrationSessionInput,
  CreatePlatformSessionInput,
  AddPlatformParticipantInput,
  // Repository Ports
  MediaSessionRepository,
  AudioSessionRepository,
  VideoSessionRepository,
  NetworkSessionRepository,
  ScreenShareSessionRepository,
  MediaDeviceRepository,
  MediaOrchestrationSessionRepository,
  MediaPlatformSessionRepository,
} from './domain/port/media-repository.js';
export type {
  // Media Session Events
  MediaSessionCreatedEvent,
  MediaSessionReadyEvent,
  MediaSessionActivatedEvent,
  MediaSessionPausedEvent,
  MediaSessionRecoveredEvent,
  MediaSessionClosedEvent,
  // Audio Engine Events
  AudioSessionCreatedEvent,
  AudioProcessingStartedEvent,
  AudioQualityDegradedEvent,
  AudioRecoveredEvent,
  AudioSessionClosedEvent,
  AudioMetricsUpdatedEvent,
  // Video Engine Events
  VideoSessionCreatedEvent,
  VideoProcessingStartedEvent,
  VideoResolutionChangedEvent,
  VideoFrameRateChangedEvent,
  VideoQualityDegradedEvent,
  VideoRecoveredEvent,
  VideoMetricsUpdatedEvent,
  VideoSessionClosedEvent,
  // Network Layer Events
  NetworkSessionCreatedEvent,
  PeerConnectionEstablishedEvent,
  StreamNegotiationCompletedEvent,
  MediaNetworkQualityDegradedEvent,
  NetworkRecoveredEvent,
  PeerDisconnectedEvent,
  PeerReconnectedEvent,
  RoutingChangedEvent,
  NetworkSessionClosedEvent,
  // Screen Share Events
  ScreenShareSessionCreatedEvent,
  ScreenCaptureStartedEvent,
  ScreenSourceChangedEvent,
  ScreenRegionUpdatedEvent,
  ScreenQualityDegradedEvent,
  ScreenRecoveredEvent,
  ScreenMetricsUpdatedEvent,
  ScreenShareSessionClosedEvent,
  // Device Events
  DeviceSelectedEvent,
  DeviceChangedEvent,
  DeviceUnavailableEvent,
  DevicePermissionDeniedEvent,
  DeviceRecoveredEvent,
  // Orchestrator Events
  MediaOrchestrationStartedEvent,
  MediaGlobalStateChangedEvent,
  SubsystemCoordinationEvent,
  QualityPolicyAppliedEvent,
  RecoveryInitiatedEvent,
  RecoveryCompletedEvent,
  MediaOrchestrationStoppedEvent,
  // Platform Events
  MediaPlatformSessionCreatedEvent,
  MediaPlatformSessionStateChangedEvent,
  ParticipantRoleUpdatedEvent,
  SessionPolicyAppliedEvent,
  MediaPlatformSessionEndedEvent,
  // Event Unions
  MediaSessionEvent,
  AudioEngineEvent,
  VideoEngineEvent,
  NetworkLayerEvent,
  ScreenShareEvent,
  DeviceEvent,
  OrchestratorEvent,
  PlatformSessionEvent,
  MediaEvent,
} from './domain/event/media-events.js';
export {
  // Media Use Cases
  CreateMediaSessionUseCase,
  type CreateMediaSessionCommand,
  ActivateMediaSessionUseCase,
  type ActivateMediaSessionCommand,
  CloseMediaSessionUseCase,
  type CloseMediaSessionCommand,
  EnableCameraUseCase,
  type EnableCameraCommand,
  EnableMicrophoneUseCase,
  type EnableMicrophoneCommand,
  ToggleScreenShareUseCase,
  type ToggleScreenShareCommand,
  SelectDeviceUseCase,
  type SelectDeviceCommand,
  DiscoverDevicesUseCase,
  type DiscoverDevicesCommand,
  AdaptMediaQualityUseCase,
  type AdaptMediaQualityCommand,
  CreateOrchestrationSessionUseCase,
  type CreateOrchestrationSessionCommand,
  CreatePlatformSessionUseCase,
  type CreatePlatformSessionCommand,
  RegisterDeviceUseCase,
  type RegisterDeviceCommand,
  GetMediaSessionUseCase,
  type GetMediaSessionCommand,
  CreateNetworkSessionUseCase,
  type CreateNetworkSessionCommand,
} from './domain/usecase/media-use-cases.js';

// Chat domain
export type {
  // Chat Types
  MessageType,
  MessageStatus,
  ConversationType,
  ConversationStatus,
  AttachmentType,
  AttachmentStatus,
  // Chat Entities
  Attachment,
  Message,
  Conversation,
  ReadReceipt,
  // Chat Errors
  ChatError,
} from './domain/model/chat.js';
export {
  CHAT_CONSTRAINTS,
  getAttachmentTypeFromMime,
  canEditMessage,
  canDeleteMessage,
} from './domain/model/chat.js';
export type {
  // Chat Repository Ports
  CreateConversationInput,
  ConversationUpdate,
  ConversationRepository,
  SendMessageInput,
  MessageUpdate,
  MessageRepository,
  UploadAttachmentInput,
  AttachmentRepository,
  ReadReceiptRepository,
} from './domain/port/chat-repository.js';
export type {
  // Conversation Events
  ConversationCreatedEvent,
  ConversationUpdatedEvent,
  ConversationArchivedEvent,
  ConversationClosedEvent,
  ParticipantAddedToConversationEvent,
  ParticipantRemovedFromConversationEvent,
  // Message Events
  MessageSentEvent,
  MessageEditedEvent,
  MessageDeletedEvent,
  MessageStatusChangedEvent,
  // Attachment Events
  AttachmentUploadedEvent,
  AttachmentDownloadedEvent,
  AttachmentStatusChangedEvent,
  // Read Receipt Events
  MessageReadEvent,
  ConversationMarkedReadEvent,
  // Event Unions
  ConversationEvent,
  MessageEvent,
  AttachmentEvent,
  ReadReceiptEvent,
  ChatEvent,
} from './domain/event/chat-events.js';
export {
  // Chat Use Cases
  CreateConversationUseCase,
  type CreateConversationCommand,
  GetConversationUseCase,
  type GetConversationCommand,
  ListConversationsUseCase,
  type ListConversationsCommand,
  SendMessageUseCase,
  type SendMessageCommand,
  EditMessageUseCase,
  type EditMessageCommand,
  DeleteMessageUseCase,
  type DeleteMessageCommand,
  ListMessagesUseCase,
  type ListMessagesCommand,
  UploadAttachmentUseCase,
  type UploadAttachmentCommand,
  GetAttachmentsUseCase,
  type GetAttachmentsCommand,
  MarkMessageReadUseCase,
  type MarkMessageReadCommand,
  MarkConversationReadUseCase,
  type MarkConversationReadCommand,
  GetUnreadCountUseCase,
  type GetUnreadCountCommand,
} from './domain/usecase/chat-use-cases.js';

// Translation domain
export type {
  // Translation Types
  TranslationSessionStatus,
  TranslationSession,
  TranscriptSegment,
  TranslatedAudioChunk,
  TranslationSessionError,
  TranslationLanguagePreference,
  GeminiLiveTranslateConfig,
  TranslationError,
} from './domain/model/translation.js';
export {
  TRANSLATION_CONSTRAINTS,
  DEFAULT_GEMINI_LIVE_TRANSLATE_CONFIG,
} from './domain/model/translation.js';
export type {
  // Translation Repository Ports
  CreateTranslationSessionInput,
  TranslationSessionRepository,
  TranscriptRepository,
  TranslationRouter,
  TranslationEventCallbacks,
  TranslationGateway,
  TranslationPrivacyLayer,
} from './domain/port/translation-repository.js';
export type {
  // Translation Session Events
  TranslationSessionStartedEvent,
  TranslationSessionTerminatedEvent,
  TranslationSessionStatusChangedEvent,
  TranslationSessionErrorEvent,
  // Translation Delivery Events
  LiveTranslationDeliveredEvent,
  TranscriptSegmentDeliveredEvent,
  // Translation Language Preference Events
  TranslationLanguagePreferenceSetEvent,
  TranslationLanguagePreferenceRemovedEvent,
  // Event Unions
  TranslationSessionEvent,
  TranslationDeliveryEvent,
  TranslationLanguagePreferenceEvent,
  TranslationEvent,
} from './domain/event/translation-events.js';
export {
  // Translation Use Cases
  StartTranslationUseCase,
  type StartTranslationCommand,
  StopTranslationUseCase,
  type StopTranslationCommand,
  ChangeTargetLanguageUseCase,
  type ChangeTargetLanguageCommand,
  StreamAudioToTranslationUseCase,
  type StreamAudioToTranslationCommand,
  GetActiveTranslationSessionsUseCase,
  type GetActiveTranslationSessionsCommand,
} from './domain/usecase/translation-use-cases.js';

// AI domain
export type {
  // AI Types
  ReportStatus,
  MeetingTranscriptContext,
  TranscriptContextSegment,
  MeetingSummary,
  ActionItem,
  MeetingReport,
  GeminiAiConfig,
  AiError,
} from './domain/model/ai.js';
export {
  AI_CONSTRAINTS,
  AI_PROMPT_TEMPLATES,
  DEFAULT_GEMINI_AI_CONFIG,
  DEFAULT_TRANSCRIPT_WINDOW_MINUTES,
} from './domain/model/ai.js';
export type {
  // AI Repository Ports
  CreateMeetingSummaryInput,
  MeetingSummaryRepository,
  CreateActionItemInput,
  ActionItemRepository,
  CreateMeetingReportInput,
  MeetingReportRepository,
  TranscriptContextRepository,
  AskAiQuestionInput,
  AiMeetingService,
} from './domain/port/ai-repository.js';
export type {
  // Meeting Summary Events
  MeetingSummaryGeneratedEvent,
  MeetingSummaryUpdatedEvent,
  // Action Item Events
  ActionItemDetectedEvent,
  ActionItemsExtractedEvent,
  // Meeting Report Events
  MeetingReportGenerationStartedEvent,
  MeetingReportReadyEvent,
  MeetingReportFailedEvent,
  MeetingReportStatusChangedEvent,
  // AI Q&A Events
  AiQuestionAskedEvent,
  AiQuestionAnsweredEvent,
  // Event Unions
  MeetingSummaryEvent,
  ActionItemEvent,
  MeetingReportEvent,
  AiQuestionEvent,
  AiEvent,
} from './domain/event/ai-events.js';
export {
  // AI Use Cases
  ProcessTranscriptSegmentUseCase,
  type ProcessTranscriptSegmentCommand,
  GenerateRunningSummaryUseCase,
  type GenerateRunningSummaryCommand,
  ExtractActionItemsUseCase,
  type ExtractActionItemsCommand,
  AskAiQuestionUseCase,
  type AskAiQuestionCommand,
  GeneratePostMeetingReportUseCase,
  type GeneratePostMeetingReportCommand,
  GetMeetingSummaryUseCase,
  type GetMeetingSummaryCommand,
  GetActionItemsUseCase,
  type GetActionItemsCommand,
  GetMeetingReportUseCase,
  type GetMeetingReportCommand,
} from './domain/usecase/ai-use-cases.js';

// Classroom domain
export type {
  // Classroom Types
  ClassroomStatus,
  QuizStatus,
  QuizOption,
  QuizResponse,
  ClassroomSession,
  AttendanceRecord,
  Quiz,
  BreakoutRoom,
  BreakoutRoomConfig,
  ClassroomError,
} from './domain/model/classroom.js';
export { CLASSROOM_CONSTRAINTS } from './domain/model/classroom.js';
export type {
  // Classroom Repository Ports
  CreateClassroomSessionInput,
  ClassroomSessionUpdate,
  ClassroomRepository,
  CreateQuizInput,
  QuizRepository,
  CreateAttendanceInput,
  AttendanceRepository,
} from './domain/port/classroom-repository.js';
export type {
  // Classroom Events
  ClassroomSessionCreatedEvent,
  ClassroomSessionEndedEvent,
  QuizCreatedEvent,
  QuizActivatedEvent,
  QuizClosedEvent,
  QuizResponseSubmittedEvent,
  BreakoutRoomsCreatedEvent,
  AttendanceRecordedEvent,
  ClassroomEvent,
} from './domain/event/classroom-events.js';
export {
  // Classroom Use Cases
  CreateClassroomSessionUseCase,
  type CreateClassroomSessionCommand,
  CreateQuizUseCase,
  type CreateQuizCommand,
  ActivateQuizUseCase,
  type ActivateQuizCommand,
  CloseQuizUseCase,
  type CloseQuizCommand,
  SubmitQuizResponseUseCase,
  type SubmitQuizResponseCommand,
  GradeQuizUseCase,
  type GradeQuizCommand,
  type QuizGradeResult,
  CreateBreakoutRoomsUseCase,
  type CreateBreakoutRoomsCommand,
  EndClassroomSessionUseCase,
  type EndClassroomSessionCommand,
  RecordAttendanceUseCase,
  type RecordAttendanceCommand,
  ExportAttendanceReportUseCase,
  type ExportAttendanceReportCommand,
  GetClassroomSessionUseCase,
  type GetClassroomSessionCommand,
  GetClassroomSessionByMeetingUseCase,
  type GetClassroomSessionByMeetingCommand,
  GetQuizUseCase,
  type GetQuizCommand,
  GetQuizResultsUseCase,
  type GetQuizResultsCommand,
  ListAttendanceRecordsUseCase,
  type ListAttendanceRecordsCommand,
} from './domain/usecase/classroom-use-cases.js';

// Whiteboard domain
export type {
  // Whiteboard Types
  WhiteboardPoint,
  WhiteboardStrokeStyle,
  WhiteboardOperationType,
  WhiteboardOperation,
  WhiteboardStroke,
  WhiteboardState,
  WhiteboardError,
} from './domain/model/whiteboard.js';
export { WHITEBOARD_CONSTRAINTS } from './domain/model/whiteboard.js';
export type {
  // Whiteboard Repository Ports
  WhiteboardSyncMessage,
  WhiteboardSyncCallbacks,
  WhiteboardSyncGateway,
  WhiteboardRepository,
} from './domain/port/whiteboard-repository.js';
export {
  // Whiteboard Use Cases
  StartStrokeUseCase,
  type StartStrokeCommand,
  MoveStrokeUseCase,
  type MoveStrokeCommand,
  EndStrokeUseCase,
  type EndStrokeCommand,
  ClearWhiteboardUseCase,
  type ClearWhiteboardCommand,
  UndoStrokeUseCase,
  type UndoStrokeCommand,
  GetWhiteboardStateUseCase,
  type GetWhiteboardStateCommand,
  ConnectWhiteboardUseCase,
  type ConnectWhiteboardCommand,
  DisconnectWhiteboardUseCase,
  SendCursorUpdateUseCase,
  type SendCursorUpdateCommand,
} from './domain/usecase/whiteboard-use-cases.js';

// Data layer
export { HttpAuthRepository } from './data/http-auth-repository.js';
export { HttpProfileRepository } from './data/http-profile-repository.js';
export { InMemoryFeatureFlagCache } from './data/in-memory-feature-flag-cache.js';
export { WebSecureTokenStorage } from './data/web-secure-token-storage.js';

// DI
export { TOKENS, type Token } from './di/tokens.js';
export { initializeSdk, resetSdk, sdkContainer, type SdkConfig } from './di/container.js';
