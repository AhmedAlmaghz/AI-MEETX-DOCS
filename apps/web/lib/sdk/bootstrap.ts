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

  initialized = true;
}

export function resolveUseCase<T>(token: symbol): T {
  ensureSdkInitialized();
  return sdkContainer.resolve<T>(token);
}

export { sdkContainer } from '@aimeetx/sdk';
