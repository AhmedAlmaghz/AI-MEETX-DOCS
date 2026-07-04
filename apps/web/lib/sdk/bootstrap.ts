/**
 * SDK bootstrap for the AI MeetX web client.
 *
 * Per ADR-005 + ADR-004: this is the single place that wires SDK use cases
 * to repository implementations. In production, the repositories would be
 * HTTP/WS adapters that call the real backend. In development, they are
 * in-memory implementations (see `./in-memory-repositories.ts`).
 *
 * The bootstrap is idempotent: calling it multiple times is safe. Each page
 * calls `ensureSdkInitialized()` to guarantee the SDK is ready before use.
 */

import 'reflect-metadata';

import { initializeSdk, sdkContainer, TOKENS } from '@aimeetx/sdk';

import { inMemoryRepositories } from './in-memory-repositories';

let initialized = false;

export function ensureSdkInitialized(): void {
  if (initialized) return;

  initializeSdk({ apiBaseUrl: 'http://localhost:0' });

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

  initialized = true;
}

export function resolveUseCase<T>(token: symbol): T {
  ensureSdkInitialized();
  return sdkContainer.resolve<T>(token);
}

export { sdkContainer } from '@aimeetx/sdk';
