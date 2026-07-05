import 'reflect-metadata';

import { initializeSdk, sdkContainer, TOKENS, WebSecureTokenStorage } from '@aimeetx/sdk';
import {
  LoginWithEmailUseCase,
  RegisterWithEmailUseCase,
  LoginAsGuestUseCase,
} from '@aimeetx/sdk';
import {
  GetProfileUseCase,
  UpdateProfileUseCase,
  UploadAvatarUseCase,
  DeleteAvatarUseCase,
  UpdateNotificationSettingsUseCase,
  UpdatePrivacySettingsUseCase,
  UpdateAccessibilitySettingsUseCase,
  UpdatePresenceUseCase,
  DeactivateAccountUseCase,
} from '@aimeetx/sdk';
import {
  CreateMeetingUseCase,
  GetMeetingUseCase,
  StartMeetingUseCase,
  EndMeetingUseCase,
  JoinMeetingUseCase,
  MuteParticipantUseCase,
  RaiseHandUseCase,
  LowerHandUseCase,
  ListParticipantsUseCase,
  ListMeetingsUseCase,
} from '@aimeetx/sdk';
import {
  ListConversationsUseCase,
  CreateConversationUseCase,
  SendMessageUseCase,
} from '@aimeetx/sdk';
import {
  StartRecordingUseCase,
  StopRecordingUseCase,
  ListRecordingsUseCase,
  DeleteRecordingUseCase,
  GetDownloadLinkUseCase,
} from '@aimeetx/sdk';
import {
  GetNotificationHistoryUseCase,
  MarkReadUseCase,
  ClearNotificationsUseCase,
} from '@aimeetx/sdk';
import { GetPlatformMetricsUseCase } from '@aimeetx/sdk';
import {
  CreateTenantUseCase,
  SuspendTenantUseCase,
  UpdateFeatureFlagsUseCase,
  GetTenantFeatureFlagsUseCase,
  QueryAuditLogUseCase,
  InviteTenantMemberUseCase,
} from '@aimeetx/sdk';
import {
  ProcessTranscriptSegmentUseCase,
  GenerateRunningSummaryUseCase,
  ExtractActionItemsUseCase,
  AskAiQuestionUseCase,
  GeneratePostMeetingReportUseCase,
} from '@aimeetx/sdk';
import {
  StartTranslationUseCase,
  StopTranslationUseCase,
  ChangeTargetLanguageUseCase,
  StreamAudioToTranslationUseCase,
} from '@aimeetx/sdk';
import {
  StartStrokeUseCase,
  MoveStrokeUseCase,
  EndStrokeUseCase,
  ClearWhiteboardUseCase,
  UndoStrokeUseCase,
  GetWhiteboardStateUseCase,
} from '@aimeetx/sdk';
import {
  CreateClassroomSessionUseCase,
  CreateQuizUseCase,
  ActivateQuizUseCase,
  CloseQuizUseCase,
  SubmitQuizResponseUseCase,
  GradeQuizUseCase,
  CreateBreakoutRoomsUseCase,
  EndClassroomSessionUseCase,
  RecordAttendanceUseCase,
  ExportAttendanceReportUseCase,
  GetClassroomSessionUseCase,
  GetClassroomSessionByMeetingUseCase,
  GetQuizUseCase,
  GetQuizResultsUseCase,
  ListAttendanceRecordsUseCase,
} from '@aimeetx/sdk';

import { inMemoryRepositories } from './in-memory-repositories';

let initialized = false;

export function ensureSdkInitialized(): void {
  if (initialized) return;

  initializeSdk({ apiBaseUrl: 'http://localhost:0' });

  // --- Infrastructure ---
  sdkContainer.register(TOKENS.SecureTokenStorage, { useClass: WebSecureTokenStorage });

  // --- Repositories (in-memory mocks) ---
  sdkContainer.registerInstance(TOKENS.AuthRepository, inMemoryRepositories.auth);
  sdkContainer.registerInstance(TOKENS.ProfileRepository, inMemoryRepositories.profile);
  sdkContainer.registerInstance(TOKENS.MeetingRepository, inMemoryRepositories.meeting);
  sdkContainer.registerInstance(TOKENS.ParticipantRepository, inMemoryRepositories.participant);
  sdkContainer.registerInstance(TOKENS.ConversationRepository, inMemoryRepositories.conversation);
  sdkContainer.registerInstance(TOKENS.MessageRepository, inMemoryRepositories.message);
  sdkContainer.registerInstance(TOKENS.AttachmentRepository, inMemoryRepositories.attachment);
  sdkContainer.registerInstance(TOKENS.ReadReceiptRepository, inMemoryRepositories.readReceipt);
  sdkContainer.registerInstance(TOKENS.ClassroomRepository, inMemoryRepositories.classroom);
  sdkContainer.registerInstance(TOKENS.QuizRepository, inMemoryRepositories.quiz);
  sdkContainer.registerInstance(TOKENS.AttendanceRepository, inMemoryRepositories.attendance);
  sdkContainer.registerInstance(TOKENS.RecordingRepository, inMemoryRepositories.recording);
  sdkContainer.registerInstance(TOKENS.RecordingGateway, inMemoryRepositories.recordingGateway);
  sdkContainer.registerInstance(TOKENS.DownloadLinkGenerator, inMemoryRepositories.downloadLinkGenerator);
  sdkContainer.registerInstance(TOKENS.NotificationRepository, inMemoryRepositories.notification);
  sdkContainer.registerInstance(TOKENS.PreferencesRepository, inMemoryRepositories.preferences);
  sdkContainer.registerInstance(TOKENS.DeviceTokenRepository, inMemoryRepositories.deviceToken);
  sdkContainer.registerInstance(TOKENS.PushGateway, inMemoryRepositories.pushGateway);
  sdkContainer.registerInstance(TOKENS.EmailGateway, inMemoryRepositories.emailGateway);
  sdkContainer.registerInstance(TOKENS.SmsGateway, inMemoryRepositories.smsGateway);
  sdkContainer.registerInstance(TOKENS.TenantRepository, inMemoryRepositories.tenant);
  sdkContainer.registerInstance(TOKENS.AuditLogRepository, inMemoryRepositories.auditLog);
  sdkContainer.registerInstance(TOKENS.MeetingFactRepository, inMemoryRepositories.meetingFact);
  sdkContainer.registerInstance(TOKENS.UserEngagementRepository, inMemoryRepositories.userEngagement);
  sdkContainer.registerInstance(TOKENS.AnalyticsSummaryRepository, inMemoryRepositories.analyticsSummary);
  sdkContainer.registerInstance(TOKENS.FeatureFlagCache, inMemoryRepositories.featureFlagCache);

  // --- AI Repositories ---
  sdkContainer.registerInstance(TOKENS.MeetingSummaryRepository, inMemoryRepositories.meetingSummary);
  sdkContainer.registerInstance(TOKENS.ActionItemRepository, inMemoryRepositories.actionItem);
  sdkContainer.registerInstance(TOKENS.MeetingReportRepository, inMemoryRepositories.meetingReport);
  sdkContainer.registerInstance(TOKENS.TranscriptContextRepository, inMemoryRepositories.transcriptContext);
  sdkContainer.registerInstance(TOKENS.AiMeetingService, inMemoryRepositories.aiMeetingService);

  // --- Translation Repositories ---
  sdkContainer.registerInstance(TOKENS.TranslationSessionRepository, inMemoryRepositories.translationSession);
  sdkContainer.registerInstance(TOKENS.TranscriptRepository, inMemoryRepositories.transcript);
  sdkContainer.registerInstance(TOKENS.TranslationRouter, inMemoryRepositories.translationRouter);
  sdkContainer.registerInstance(TOKENS.TranslationGateway, inMemoryRepositories.translationGateway);
  sdkContainer.registerInstance(TOKENS.TranslationPrivacyLayer, inMemoryRepositories.translationPrivacyLayer);

  // --- Whiteboard Repositories ---
  sdkContainer.registerInstance(TOKENS.WhiteboardRepository, inMemoryRepositories.whiteboard);
  sdkContainer.registerInstance(TOKENS.WhiteboardSyncGateway, inMemoryRepositories.whiteboardSync);

  // --- Use Cases ---
  sdkContainer.register(TOKENS.LoginWithEmailUseCase, { useClass: LoginWithEmailUseCase });
  sdkContainer.register(TOKENS.RegisterWithEmailUseCase, { useClass: RegisterWithEmailUseCase });
  sdkContainer.register(TOKENS.LoginAsGuestUseCase, { useClass: LoginAsGuestUseCase });

  sdkContainer.register(TOKENS.GetProfileUseCase, { useClass: GetProfileUseCase });
  sdkContainer.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
  sdkContainer.register(TOKENS.UploadAvatarUseCase, { useClass: UploadAvatarUseCase });
  sdkContainer.register(TOKENS.DeleteAvatarUseCase, { useClass: DeleteAvatarUseCase });
  sdkContainer.register(TOKENS.UpdateNotificationSettingsUseCase, { useClass: UpdateNotificationSettingsUseCase });
  sdkContainer.register(TOKENS.UpdatePrivacySettingsUseCase, { useClass: UpdatePrivacySettingsUseCase });
  sdkContainer.register(TOKENS.UpdateAccessibilitySettingsUseCase, { useClass: UpdateAccessibilitySettingsUseCase });
  sdkContainer.register(TOKENS.UpdatePresenceUseCase, { useClass: UpdatePresenceUseCase });
  sdkContainer.register(TOKENS.DeactivateAccountUseCase, { useClass: DeactivateAccountUseCase });

  sdkContainer.register(TOKENS.CreateMeetingUseCase, { useClass: CreateMeetingUseCase });
  sdkContainer.register(TOKENS.GetMeetingUseCase, { useClass: GetMeetingUseCase });
  sdkContainer.register(TOKENS.StartMeetingUseCase, { useClass: StartMeetingUseCase });
  sdkContainer.register(TOKENS.EndMeetingUseCase, { useClass: EndMeetingUseCase });
  sdkContainer.register(TOKENS.JoinMeetingUseCase, { useClass: JoinMeetingUseCase });
  sdkContainer.register(TOKENS.MuteParticipantUseCase, { useClass: MuteParticipantUseCase });
  sdkContainer.register(TOKENS.RaiseHandUseCase, { useClass: RaiseHandUseCase });
  sdkContainer.register(TOKENS.LowerHandUseCase, { useClass: LowerHandUseCase });
  sdkContainer.register(TOKENS.ListParticipantsUseCase, { useClass: ListParticipantsUseCase });
  sdkContainer.register(TOKENS.ListMeetingsUseCase, { useClass: ListMeetingsUseCase });

  sdkContainer.register(TOKENS.ListConversationsUseCase, { useClass: ListConversationsUseCase });
  sdkContainer.register(TOKENS.CreateConversationUseCase, { useClass: CreateConversationUseCase });
  sdkContainer.register(TOKENS.SendMessageUseCase, { useClass: SendMessageUseCase });

  sdkContainer.register(TOKENS.StartRecordingUseCase, { useClass: StartRecordingUseCase });
  sdkContainer.register(TOKENS.StopRecordingUseCase, { useClass: StopRecordingUseCase });
  sdkContainer.register(TOKENS.ListRecordingsUseCase, { useClass: ListRecordingsUseCase });
  sdkContainer.register(TOKENS.DeleteRecordingUseCase, { useClass: DeleteRecordingUseCase });
  sdkContainer.register(TOKENS.GetDownloadLinkUseCase, { useClass: GetDownloadLinkUseCase });

  sdkContainer.register(TOKENS.GetNotificationHistoryUseCase, { useClass: GetNotificationHistoryUseCase });
  sdkContainer.register(TOKENS.MarkReadUseCase, { useClass: MarkReadUseCase });
  sdkContainer.register(TOKENS.ClearNotificationsUseCase, { useClass: ClearNotificationsUseCase });

  sdkContainer.register(TOKENS.GetPlatformMetricsUseCase, { useClass: GetPlatformMetricsUseCase });

  // --- Admin Use Cases ---
  sdkContainer.register(TOKENS.CreateTenantUseCase, { useClass: CreateTenantUseCase });
  sdkContainer.register(TOKENS.SuspendTenantUseCase, { useClass: SuspendTenantUseCase });
  sdkContainer.register(TOKENS.UpdateFeatureFlagsUseCase, { useClass: UpdateFeatureFlagsUseCase });
  sdkContainer.register(TOKENS.GetTenantFeatureFlagsUseCase, { useClass: GetTenantFeatureFlagsUseCase });
  sdkContainer.register(TOKENS.QueryAuditLogUseCase, { useClass: QueryAuditLogUseCase });
  sdkContainer.register(TOKENS.InviteTenantMemberUseCase, { useClass: InviteTenantMemberUseCase });

  // --- AI Use Cases ---
  sdkContainer.register(TOKENS.ProcessTranscriptSegmentUseCase, { useClass: ProcessTranscriptSegmentUseCase });
  sdkContainer.register(TOKENS.GenerateRunningSummaryUseCase, { useClass: GenerateRunningSummaryUseCase });
  sdkContainer.register(TOKENS.ExtractActionItemsUseCase, { useClass: ExtractActionItemsUseCase });
  sdkContainer.register(TOKENS.AskAiQuestionUseCase, { useClass: AskAiQuestionUseCase });
  sdkContainer.register(TOKENS.GeneratePostMeetingReportUseCase, { useClass: GeneratePostMeetingReportUseCase });

  // --- Translation Use Cases ---
  sdkContainer.register(TOKENS.StartTranslationUseCase, { useClass: StartTranslationUseCase });
  sdkContainer.register(TOKENS.StopTranslationUseCase, { useClass: StopTranslationUseCase });
  sdkContainer.register(TOKENS.ChangeTargetLanguageUseCase, { useClass: ChangeTargetLanguageUseCase });
  sdkContainer.register(TOKENS.StreamAudioToTranslationUseCase, { useClass: StreamAudioToTranslationUseCase });

  // --- Whiteboard Use Cases ---
  sdkContainer.register(TOKENS.StartStrokeUseCase, { useClass: StartStrokeUseCase });
  sdkContainer.register(TOKENS.MoveStrokeUseCase, { useClass: MoveStrokeUseCase });
  sdkContainer.register(TOKENS.EndStrokeUseCase, { useClass: EndStrokeUseCase });
  sdkContainer.register(TOKENS.ClearWhiteboardUseCase, { useClass: ClearWhiteboardUseCase });
  sdkContainer.register(TOKENS.UndoStrokeUseCase, { useClass: UndoStrokeUseCase });
  sdkContainer.register(TOKENS.GetWhiteboardStateUseCase, { useClass: GetWhiteboardStateUseCase });

  // --- Classroom Use Cases ---
  sdkContainer.register(TOKENS.CreateClassroomSessionUseCase, { useClass: CreateClassroomSessionUseCase });
  sdkContainer.register(TOKENS.GetClassroomSessionUseCase, { useClass: GetClassroomSessionUseCase });
  sdkContainer.register(TOKENS.GetClassroomSessionByMeetingUseCase, { useClass: GetClassroomSessionByMeetingUseCase });
  sdkContainer.register(TOKENS.EndClassroomSessionUseCase, { useClass: EndClassroomSessionUseCase });
  sdkContainer.register(TOKENS.CreateQuizUseCase, { useClass: CreateQuizUseCase });
  sdkContainer.register(TOKENS.ActivateQuizUseCase, { useClass: ActivateQuizUseCase });
  sdkContainer.register(TOKENS.CloseQuizUseCase, { useClass: CloseQuizUseCase });
  sdkContainer.register(TOKENS.SubmitQuizResponseUseCase, { useClass: SubmitQuizResponseUseCase });
  sdkContainer.register(TOKENS.GradeQuizUseCase, { useClass: GradeQuizUseCase });
  sdkContainer.register(TOKENS.CreateBreakoutRoomsUseCase, { useClass: CreateBreakoutRoomsUseCase });
  sdkContainer.register(TOKENS.RecordAttendanceUseCase, { useClass: RecordAttendanceUseCase });
  sdkContainer.register(TOKENS.ExportAttendanceReportUseCase, { useClass: ExportAttendanceReportUseCase });
  sdkContainer.register(TOKENS.GetQuizUseCase, { useClass: GetQuizUseCase });
  sdkContainer.register(TOKENS.GetQuizResultsUseCase, { useClass: GetQuizResultsUseCase });
  sdkContainer.register(TOKENS.ListAttendanceRecordsUseCase, { useClass: ListAttendanceRecordsUseCase });

  initialized = true;
}

export function resolveUseCase<T>(token: symbol): T {
  ensureSdkInitialized();
  return sdkContainer.resolve<T>(token);
}

export { sdkContainer } from '@aimeetx/sdk';
