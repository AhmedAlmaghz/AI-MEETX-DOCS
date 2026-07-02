/**
 * DI tokens for the AI MeetX SDK.
 *
 * Per ADR-004 (Clean Architecture) and ADR-005 §7:
 * The SDK uses tsyringe as the DI container. Tokens are unique symbols
 * that identify dependencies in the container.
 *
 * Each token corresponds to a Port (interface) in the domain layer.
 * Implementations are bound to these tokens in the data layer.
 */
export const TOKENS = {
  // Infrastructure
  HttpClient: Symbol.for('@aimeetx/sdk/HttpClient'),
  EventBus: Symbol.for('@aimeetx/sdk/EventBus'),
  KeyValueStore: Symbol.for('@aimeetx/sdk/KeyValueStore'),
  SecureTokenStorage: Symbol.for('@aimeetx/sdk/SecureTokenStorage'),

  // Repositories (Ports)
  UserRepository: Symbol.for('@aimeetx/sdk/UserRepository'),
  AuthRepository: Symbol.for('@aimeetx/sdk/AuthRepository'),
  ProfileRepository: Symbol.for('@aimeetx/sdk/ProfileRepository'),
  MeetingRepository: Symbol.for('@aimeetx/sdk/MeetingRepository'),
  ParticipantRepository: Symbol.for('@aimeetx/sdk/ParticipantRepository'),

  // Use Cases
  GetCurrentUserUseCase: Symbol.for('@aimeetx/sdk/GetCurrentUserUseCase'),
  LoginWithEmailUseCase: Symbol.for('@aimeetx/sdk/LoginWithEmailUseCase'),
  RegisterWithEmailUseCase: Symbol.for('@aimeetx/sdk/RegisterWithEmailUseCase'),
  LoginAsGuestUseCase: Symbol.for('@aimeetx/sdk/LoginAsGuestUseCase'),
  LogoutUseCase: Symbol.for('@aimeetx/sdk/LogoutUseCase'),
  RefreshSessionUseCase: Symbol.for('@aimeetx/sdk/RefreshSessionUseCase'),

  // Profile Use Cases
  GetProfileUseCase: Symbol.for('@aimeetx/sdk/GetProfileUseCase'),
  UpdateProfileUseCase: Symbol.for('@aimeetx/sdk/UpdateProfileUseCase'),
  UploadAvatarUseCase: Symbol.for('@aimeetx/sdk/UploadAvatarUseCase'),
  DeleteAvatarUseCase: Symbol.for('@aimeetx/sdk/DeleteAvatarUseCase'),
  UpdateLanguagePreferenceUseCase: Symbol.for('@aimeetx/sdk/UpdateLanguagePreferenceUseCase'),
  UpdateThemeUseCase: Symbol.for('@aimeetx/sdk/UpdateThemeUseCase'),
  UpdateNotificationSettingsUseCase: Symbol.for('@aimeetx/sdk/UpdateNotificationSettingsUseCase'),
  UpdatePrivacySettingsUseCase: Symbol.for('@aimeetx/sdk/UpdatePrivacySettingsUseCase'),
  UpdateAccessibilitySettingsUseCase: Symbol.for('@aimeetx/sdk/UpdateAccessibilitySettingsUseCase'),
  UpdatePresenceUseCase: Symbol.for('@aimeetx/sdk/UpdatePresenceUseCase'),
  DeactivateAccountUseCase: Symbol.for('@aimeetx/sdk/DeactivateAccountUseCase'),

  // Meeting Use Cases
  CreateMeetingUseCase: Symbol.for('@aimeetx/sdk/CreateMeetingUseCase'),
  GetMeetingUseCase: Symbol.for('@aimeetx/sdk/GetMeetingUseCase'),
  UpdateMeetingUseCase: Symbol.for('@aimeetx/sdk/UpdateMeetingUseCase'),
  StartMeetingUseCase: Symbol.for('@aimeetx/sdk/StartMeetingUseCase'),
  EndMeetingUseCase: Symbol.for('@aimeetx/sdk/EndMeetingUseCase'),
  JoinMeetingUseCase: Symbol.for('@aimeetx/sdk/JoinMeetingUseCase'),
  LeaveMeetingUseCase: Symbol.for('@aimeetx/sdk/LeaveMeetingUseCase'),
  MuteParticipantUseCase: Symbol.for('@aimeetx/sdk/MuteParticipantUseCase'),
  ChangeParticipantRoleUseCase: Symbol.for('@aimeetx/sdk/ChangeParticipantRoleUseCase'),
  RaiseHandUseCase: Symbol.for('@aimeetx/sdk/RaiseHandUseCase'),
  LowerHandUseCase: Symbol.for('@aimeetx/sdk/LowerHandUseCase'),
  ListParticipantsUseCase: Symbol.for('@aimeetx/sdk/ListParticipantsUseCase'),
  ListMeetingsUseCase: Symbol.for('@aimeetx/sdk/ListMeetingsUseCase'),

  // Media Repositories (Ports)
  MediaSessionRepository: Symbol.for('@aimeetx/sdk/MediaSessionRepository'),
  AudioSessionRepository: Symbol.for('@aimeetx/sdk/AudioSessionRepository'),
  VideoSessionRepository: Symbol.for('@aimeetx/sdk/VideoSessionRepository'),
  NetworkSessionRepository: Symbol.for('@aimeetx/sdk/NetworkSessionRepository'),
  ScreenShareSessionRepository: Symbol.for('@aimeetx/sdk/ScreenShareSessionRepository'),
  MediaDeviceRepository: Symbol.for('@aimeetx/sdk/MediaDeviceRepository'),
  MediaOrchestrationSessionRepository: Symbol.for('@aimeetx/sdk/MediaOrchestrationSessionRepository'),
  MediaPlatformSessionRepository: Symbol.for('@aimeetx/sdk/MediaPlatformSessionRepository'),

  // Media Use Cases
  CreateMediaSessionUseCase: Symbol.for('@aimeetx/sdk/CreateMediaSessionUseCase'),
  ActivateMediaSessionUseCase: Symbol.for('@aimeetx/sdk/ActivateMediaSessionUseCase'),
  CloseMediaSessionUseCase: Symbol.for('@aimeetx/sdk/CloseMediaSessionUseCase'),
  EnableCameraUseCase: Symbol.for('@aimeetx/sdk/EnableCameraUseCase'),
  EnableMicrophoneUseCase: Symbol.for('@aimeetx/sdk/EnableMicrophoneUseCase'),
  ToggleScreenShareUseCase: Symbol.for('@aimeetx/sdk/ToggleScreenShareUseCase'),
  SelectDeviceUseCase: Symbol.for('@aimeetx/sdk/SelectDeviceUseCase'),
  DiscoverDevicesUseCase: Symbol.for('@aimeetx/sdk/DiscoverDevicesUseCase'),
  AdaptMediaQualityUseCase: Symbol.for('@aimeetx/sdk/AdaptMediaQualityUseCase'),
  CreateOrchestrationSessionUseCase: Symbol.for('@aimeetx/sdk/CreateOrchestrationSessionUseCase'),
  CreatePlatformSessionUseCase: Symbol.for('@aimeetx/sdk/CreatePlatformSessionUseCase'),
  RegisterDeviceUseCase: Symbol.for('@aimeetx/sdk/RegisterDeviceUseCase'),
  GetMediaSessionUseCase: Symbol.for('@aimeetx/sdk/GetMediaSessionUseCase'),
  CreateNetworkSessionUseCase: Symbol.for('@aimeetx/sdk/CreateNetworkSessionUseCase'),

  // Chat Repositories (Ports)
  ConversationRepository: Symbol.for('@aimeetx/sdk/ConversationRepository'),
  MessageRepository: Symbol.for('@aimeetx/sdk/MessageRepository'),
  AttachmentRepository: Symbol.for('@aimeetx/sdk/AttachmentRepository'),
  ReadReceiptRepository: Symbol.for('@aimeetx/sdk/ReadReceiptRepository'),

  // Chat Use Cases
  CreateConversationUseCase: Symbol.for('@aimeetx/sdk/CreateConversationUseCase'),
  GetConversationUseCase: Symbol.for('@aimeetx/sdk/GetConversationUseCase'),
  ListConversationsUseCase: Symbol.for('@aimeetx/sdk/ListConversationsUseCase'),
  SendMessageUseCase: Symbol.for('@aimeetx/sdk/SendMessageUseCase'),
  EditMessageUseCase: Symbol.for('@aimeetx/sdk/EditMessageUseCase'),
  DeleteMessageUseCase: Symbol.for('@aimeetx/sdk/DeleteMessageUseCase'),
  ListMessagesUseCase: Symbol.for('@aimeetx/sdk/ListMessagesUseCase'),
  UploadAttachmentUseCase: Symbol.for('@aimeetx/sdk/UploadAttachmentUseCase'),
  GetAttachmentsUseCase: Symbol.for('@aimeetx/sdk/GetAttachmentsUseCase'),
  MarkMessageReadUseCase: Symbol.for('@aimeetx/sdk/MarkMessageReadUseCase'),
  MarkConversationReadUseCase: Symbol.for('@aimeetx/sdk/MarkConversationReadUseCase'),
  GetUnreadCountUseCase: Symbol.for('@aimeetx/sdk/GetUnreadCountUseCase'),

  // Translation Repositories (Ports)
  TranslationSessionRepository: Symbol.for('@aimeetx/sdk/TranslationSessionRepository'),
  TranscriptRepository: Symbol.for('@aimeetx/sdk/TranscriptRepository'),
  TranslationRouter: Symbol.for('@aimeetx/sdk/TranslationRouter'),
  TranslationGateway: Symbol.for('@aimeetx/sdk/TranslationGateway'),
  TranslationPrivacyLayer: Symbol.for('@aimeetx/sdk/TranslationPrivacyLayer'),

  // Translation Use Cases
  StartTranslationUseCase: Symbol.for('@aimeetx/sdk/StartTranslationUseCase'),
  StopTranslationUseCase: Symbol.for('@aimeetx/sdk/StopTranslationUseCase'),
  ChangeTargetLanguageUseCase: Symbol.for('@aimeetx/sdk/ChangeTargetLanguageUseCase'),
  StreamAudioToTranslationUseCase: Symbol.for('@aimeetx/sdk/StreamAudioToTranslationUseCase'),

  // AI Repositories (Ports)
  MeetingSummaryRepository: Symbol.for('@aimeetx/sdk/MeetingSummaryRepository'),
  ActionItemRepository: Symbol.for('@aimeetx/sdk/ActionItemRepository'),
  MeetingReportRepository: Symbol.for('@aimeetx/sdk/MeetingReportRepository'),
  TranscriptContextRepository: Symbol.for('@aimeetx/sdk/TranscriptContextRepository'),
  AiMeetingService: Symbol.for('@aimeetx/sdk/AiMeetingService'),

  // AI Use Cases
  GenerateRunningSummaryUseCase: Symbol.for('@aimeetx/sdk/GenerateRunningSummaryUseCase'),
  ExtractActionItemsUseCase: Symbol.for('@aimeetx/sdk/ExtractActionItemsUseCase'),
  AskAiQuestionUseCase: Symbol.for('@aimeetx/sdk/AskAiQuestionUseCase'),
  GeneratePostMeetingReportUseCase: Symbol.for('@aimeetx/sdk/GeneratePostMeetingReportUseCase'),
  ProcessTranscriptSegmentUseCase: Symbol.for('@aimeetx/sdk/ProcessTranscriptSegmentUseCase'),
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];