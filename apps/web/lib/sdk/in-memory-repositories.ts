/**
 * In-memory mock repositories for the AI MeetX web client.
 *
 * Per ADR-005 + ADR-004 (Clean Architecture): the SDK defines repository
 * PORTS in the domain layer, and the data layer provides concrete adapters.
 * This module provides in-memory implementations of every port so the
 * web app can run end-to-end without a backend.
 *
 * Production behaviour: swap this file for HTTP/WS adapters that call
 * the real API. The DI container wiring is identical.
 */

import { failure, success, type Result, type Uuid } from '@aimeetx/types';
import type {
  UserId,
  MeetingId,
  ParticipantId,
  ConversationId,
  MessageId,
  ClassroomSessionId,
  AttendanceId,
  NotificationId,
  RecordingId,
  OrganizationId,
  SummaryId,
  ActionItemId,
  ReportId,
  TranslationSessionId,
  TranslationSegmentId,
} from '@aimeetx/types';

import type {
  AuthCredentials,
  RegisterInput,
  Session,
  AuthRepository,
} from '@aimeetx/sdk';

import type {
  AccessibilitySettings,
  AccountStatus,
  AvatarUpload,
  AvatarUploadResult,
  NotificationSettings,
  Presence,
  PrivacySettings,
  Theme,
  UserPreferences,
  UserProfile,
  UserRole,
  ProfileRepository,
  ProfileUpdate,
} from '@aimeetx/sdk';

import type {
  Meeting,
  MeetingSettings,
  MeetingUpdate,
  Participant,
  ParticipantRole,
  ParticipantStatus,
  MeetingRepository,
  ParticipantRepository,
  CreateMeetingInput,
  JoinMeetingInput,
} from '@aimeetx/sdk';

import type {
  Conversation,
  Message,
  MessageStatus,
  ConversationRepository,
  MessageRepository,
  AttachmentRepository,
  ReadReceiptRepository,
  Attachment,
  SendMessageInput,
  CreateConversationInput,
  ConversationUpdate,
  UploadAttachmentInput,
  ReadReceipt,
} from '@aimeetx/sdk';

import type {
  Quiz,
  AttendanceRecord,
  BreakoutRoom,
  ClassroomSession,
  ClassroomRepository,
  QuizRepository,
  AttendanceRepository,
  CreateClassroomSessionInput,
  CreateQuizInput,
  CreateAttendanceInput,
  CreateBreakoutRoomsCommand,
  ExportAttendanceReportCommand,
  RecordAttendanceCommand,
} from '@aimeetx/sdk';

import type {
  MeetingRecording,
  RecordingLayout,
  RecordingRepository,
  RecordingActorClaims,
  StartRecordingInput,
  DownloadLinkGenerator,
  EgressStatus,
  RecordingGateway,
} from '@aimeetx/sdk';

import type {
  Notification,
  NotificationType,
  DevicePlatform,
  DeviceToken,
  NotificationRepository,
  PreferencesRepository,
  DeviceTokenRepository,
  PushGateway,
  EmailGateway,
  SmsGateway,
  NotificationChannel,
} from '@aimeetx/sdk';

import type {
  Tenant,
  TenantMember,
  TenantFeatureFlags,
  AuditLogEntry,
  TenantRepository,
  AuditLogRepository,
  InviteTenantMemberInput,
  AdminActorClaims,
  CreateTenantInput,
  AuditLogQuery,
} from '@aimeetx/sdk';

import type {
  MeetingFact,
  UserEngagementFact,
  TenantDailySummary,
  PlatformDailySummary,
  MeetingAnalyticsSummary,
  PlatformMetricsSummary,
  AnalyticsDateRange,
  AnalyticsSummaryRepository,
  MeetingFactRepository,
  UserEngagementRepository,
  AnalyticsActorClaims,
  MeetingFactUpdate,
  AnalyticsGranularity,
} from '@aimeetx/sdk';

import { InMemoryFeatureFlagCache, AVATAR_CONSTRAINTS, DEFAULT_TENANT_FEATURE_FLAGS, NOTIFICATION_CONSTRAINTS } from '@aimeetx/sdk';
import type {
  FeatureFlagCache,
  TenantId,
  AnalyticsTenantId,
  UserNotificationPreferences,
  MeetingSummary,
  ActionItem,
  MeetingReport,
  MeetingSummaryRepository,
  ActionItemRepository,
  MeetingReportRepository,
  TranscriptContextRepository,
  AiMeetingService,
  MeetingTranscriptContext,
  TranscriptContextSegment,
  AskAiQuestionInput,
  CreateMeetingSummaryInput,
  CreateActionItemInput,
  CreateMeetingReportInput,
  TranslationSession,
  TranscriptSegment,
  TranslationLanguagePreference,
  GeminiLiveTranslateConfig,
  TranslationSessionError,
  CreateTranslationSessionInput,
  TranslationSessionRepository,
  TranscriptRepository,
  TranslationRouter,
  TranslationGateway,
  TranslationPrivacyLayer,
  TranslationEventCallbacks,
  WhiteboardRepository,
  WhiteboardState,
  WhiteboardStroke,
  WhiteboardSyncGateway,
  WhiteboardSyncCallbacks,
  WhiteboardOperation,
} from '@aimeetx/sdk';

const store = {
  sessions: new Map<string, Session>(),
  users: new Map<UserId, UserProfile>(),
  participants: new Map<string, Participant>(),
  participantsByMeeting: new Map<string, Set<string>>(),
  meetings: new Map<string, Meeting>(),
  conversations: new Map<string, Conversation>(),
  messages: new Map<string, Message>(),
  classroomSessions: new Map<string, ClassroomSession>(),
  quizzes: new Map<string, Quiz>(),
  attendance: new Map<string, AttendanceRecord>(),
  recordings: new Map<string, MeetingRecording>(),
  notifications: new Map<string, Notification>(),
  deviceTokens: new Map<string, DeviceToken>(),
  tenants: new Map<string, Tenant>(),
  tenantMembers: new Map<string, TenantMember>(),
  auditLogs: new Map<string, AuditLogEntry>(),
  meetingFacts: new Map<string, MeetingFact>(),
  engagementFacts: new Map<string, UserEngagementFact>(),
  tenantSummaries: new Map<string, TenantDailySummary>(),
  platformSummaries: new Map<string, PlatformDailySummary>(),
};

function uid(prefix: string): Uuid {
  return `${prefix}_${crypto.randomUUID()}` as Uuid;
}

function nowIso(): import('@aimeetx/types').IsoDateString {
  return new Date().toISOString() as import('@aimeetx/types').IsoDateString;
}

function delay<T>(value: T, ms = 0): Promise<Result<T, Error>> {
  return new Promise((resolve) => {
    if (ms <= 0) resolve(success(value));
    else setTimeout(() => resolve(success(value)), ms);
  });
}

function err(message: string): Result<never, Error> {
  return failure(new Error(message));
}

function seedDefaultData(): void {
  if (store.users.size > 0) return;

  const demoUserId = 'user_demo_123' as UserId;
  const demoProfile: UserProfile = {
    userId: demoUserId,
    displayName: 'Demo User',
    email: '[email protected]',
    avatarUrl: null,
    preferredLanguage: 'en',
    translationLanguage: 'en',
    subtitleLanguage: 'en',
    theme: 'system',
    role: 'admin' as UserRole,
    status: 'active' as AccountStatus,
    presence: 'online' as Presence,
    preferences: { theme: 'system', language: 'en', translationLanguage: 'en', subtitleLanguage: 'en' } as UserPreferences,
    notifications: { pushEnabled: true, meetingEnabled: true, chatEnabled: true, reminderEnabled: true } as NotificationSettings,
    privacy: { profileVisibility: 'contacts_only', onlineStatusVisible: true, readReceiptsEnabled: true, activityVisible: true } as PrivacySettings,
    accessibility: { fontScale: 1.0, highContrast: false, reduceAnimations: false, screenReaderHints: true } as AccessibilitySettings,
    createdAt: '2026-01-01T00:00:00.000Z' as import('@aimeetx/types').IsoDateString,
    updatedAt: '2026-01-01T00:00:00.000Z' as import('@aimeetx/types').IsoDateString,
  };
  store.users.set(demoUserId, demoProfile);

  for (let i = 1; i <= 4; i += 1) {
    const id = `meeting_demo_${i}` as MeetingId;
    const meeting: Meeting = {
      id,
      title: `Demo Meeting ${i}`,
      description: i === 1 ? 'Sprint planning session' : null,
      hostId: demoUserId,
      status: (i === 1 ? 'active' : i === 2 ? 'scheduled' : 'ended') as Meeting['status'],
      passcode: null,
      maxParticipants: 100,
      settings: { waitingRoomEnabled: false, muteOnEntry: true, videoOnEntry: true, allowRecording: true, allowTranscription: false, chatEnabled: true, handRaiseEnabled: true, breakoutRoomsEnabled: false } as MeetingSettings,
      livekitRoomName: `room_demo_${i}`,
      startedAt: (i === 1 ? nowIso() : null) as Meeting['startedAt'],
      endedAt: (i === 3 ? nowIso() : null) as Meeting['endedAt'],
      createdAt: '2026-01-01T00:00:00.000Z' as import('@aimeetx/types').IsoDateString,
      updatedAt: '2026-01-01T00:00:00.000Z' as import('@aimeetx/types').IsoDateString,
    };
    store.meetings.set(id, meeting);
  }

  const recId = `rec_demo_1` as RecordingId;
  const recMeetingId = `meeting_demo_3` as MeetingId;
  const recording: MeetingRecording = {
    id: recId,
    meetingId: recMeetingId,
    egressId: 'egress_demo_1',
    layout: 'speaker_view' as RecordingLayout,
    status: 'ready',
    storageUrl: '/api/v1/meetings/demo/recordings/demo.mp4',
    fileSizeBytes: 256_000_000,
    durationSeconds: 3600,
    startedBy: 'participant_host' as ParticipantId,
    startedAt: '2026-01-01T10:00:00.000Z' as import('@aimeetx/types').IsoDateString,
    stoppedAt: '2026-01-01T11:00:00.000Z' as import('@aimeetx/types').IsoDateString,
    expiresAt: '2026-02-01T11:00:00.000Z' as import('@aimeetx/types').IsoDateString,
  };
  store.recordings.set(recId, recording);

  for (let i = 0; i < 3; i += 1) {
    const nId = `notif_demo_${i}` as NotificationId;
    const notif: Notification = {
      id: nId,
      recipientId: demoUserId,
      type: (['meeting_reminder', 'recording_ready', 'meeting_started'] as const)[i]! as NotificationType,
      channel: 'push' as const,
      title: (['Upcoming meeting', 'Recording ready', 'Meeting started'] as const)[i]!,
      body: (['Sprint planning in 15 min', 'Your recording is ready to download', 'Demo Meeting 1 just started'] as const)[i]!,
      data: {},
      status: (['pending', 'sent', 'sent'] as const)[i]! as Notification['status'],
      idempotencyKey: nId,
      createdAt: nowIso(),
      sentAt: (i === 0 ? null : nowIso()) as Notification['sentAt'],
      readAt: null,
    };
    store.notifications.set(nId, notif);
  }
}

seedDefaultData();

class InMemoryAuthRepository implements AuthRepository {
  async loginWithEmail(credentials: AuthCredentials): Promise<Result<Session, Error>> {
    if (!credentials.email || !credentials.password) return err('Email and password are required');
    const userId = `user_${credentials.email.split('@')[0]}` as UserId;
    if (!store.users.has(userId)) {
      store.users.set(userId, {
        userId, displayName: credentials.email.split('@')[0] ?? 'User', email: credentials.email,
        avatarUrl: null, preferredLanguage: 'en', translationLanguage: 'en', subtitleLanguage: 'en',
        theme: 'system', role: 'member', status: 'active', presence: 'online',
        preferences: { theme: 'system', language: 'en', translationLanguage: 'en', subtitleLanguage: 'en' },
        notifications: { pushEnabled: true, meetingEnabled: true, chatEnabled: true, reminderEnabled: true },
        privacy: { profileVisibility: 'contacts_only', onlineStatusVisible: true, readReceiptsEnabled: true, activityVisible: true },
        accessibility: { fontScale: 1.0, highContrast: false, reduceAnimations: false, screenReaderHints: true },
        createdAt: nowIso(), updatedAt: nowIso(),
      });
    }
    return delay(makeSession(userId));
  }

  async register(input: RegisterInput): Promise<Result<Session, Error>> {
    if (!input.email || !input.password || !input.displayName) return err('All fields are required');
    if (input.password.length < 8) return err('Password must be at least 8 characters');
    const userId = `user_${input.email.split('@')[0]}` as UserId;
    store.users.set(userId, {
      userId, displayName: input.displayName, email: input.email, avatarUrl: null,
      preferredLanguage: 'en', translationLanguage: 'en', subtitleLanguage: 'en',
      theme: 'system', role: 'member', status: 'active', presence: 'online',
      preferences: { theme: 'system', language: 'en', translationLanguage: 'en', subtitleLanguage: 'en' },
      notifications: { pushEnabled: true, meetingEnabled: true, chatEnabled: true, reminderEnabled: true },
      privacy: { profileVisibility: 'contacts_only', onlineStatusVisible: true, readReceiptsEnabled: true, activityVisible: true },
      accessibility: { fontScale: 1.0, highContrast: false, reduceAnimations: false, screenReaderHints: true },
      createdAt: nowIso(), updatedAt: nowIso(),
    });
    return delay(makeSession(userId));
  }

  async loginAsGuest(): Promise<Result<Session, Error>> {
    const userId = `user_guest_${Math.random().toString(36).slice(2, 8)}` as UserId;
    store.users.set(userId, {
      userId, displayName: `Guest ${userId.slice(-4).toUpperCase()}`, email: `${userId}@guest.local`,
      avatarUrl: null, preferredLanguage: 'en', translationLanguage: 'en', subtitleLanguage: 'en',
      theme: 'system', role: 'guest', status: 'active', presence: 'online',
      preferences: { theme: 'system', language: 'en', translationLanguage: 'en', subtitleLanguage: 'en' },
      notifications: { pushEnabled: false, meetingEnabled: true, chatEnabled: true, reminderEnabled: false },
      privacy: { profileVisibility: 'private', onlineStatusVisible: false, readReceiptsEnabled: false, activityVisible: false },
      accessibility: { fontScale: 1.0, highContrast: false, reduceAnimations: false, screenReaderHints: true },
      createdAt: nowIso(), updatedAt: nowIso(),
    });
    return delay(makeSession(userId, 'guest'));
  }

  async logout(): Promise<Result<void, Error>> { return delay(undefined); }
  async refreshSession(): Promise<Result<Session, Error>> { return err('No active session to refresh'); }
  async getCurrentSession(): Promise<Result<Session | null, Error>> { return delay(null); }
}

function makeSession(userId: UserId, kind: 'authenticated' | 'guest' = 'authenticated'): Session {
  return {
    id: uid('session'),
    userId,
    accessToken: `mock_access_${userId}_${Date.now()}`,
    refreshToken: `mock_refresh_${userId}_${Date.now()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() as import('@aimeetx/types').IsoDateString,
    status: kind === 'guest' ? 'guest' : 'active',
    createdAt: nowIso(),
  };
}

class InMemoryProfileRepository implements ProfileRepository {
  async getProfile(userId: UserId): Promise<Result<UserProfile, Error>> {
    const profile = store.users.get(userId);
    return profile ? delay(profile) : err('Profile not found');
  }

  async updateProfile(userId: UserId, update: ProfileUpdate): Promise<Result<UserProfile, Error>> {
    const current = store.users.get(userId);
    if (!current) return err('Profile not found');
    const next: UserProfile = {
      ...current,
      displayName: update.displayName ?? current.displayName,
      preferredLanguage: update.preferredLanguage ?? current.preferredLanguage,
      translationLanguage: update.translationLanguage ?? current.translationLanguage,
      subtitleLanguage: update.subtitleLanguage ?? current.subtitleLanguage,
      theme: (update.theme ?? current.theme) as Theme,
      updatedAt: nowIso(),
    };
    store.users.set(userId, next);
    return delay(next);
  }

  async uploadAvatar(userId: UserId, avatar: AvatarUpload): Promise<Result<AvatarUploadResult, Error>> {
    if (avatar.file.size > AVATAR_CONSTRAINTS.MAX_SIZE_BYTES) return err('File too large');
    const url = `data:${avatar.mimeType};base64,mock_avatar_${Date.now()}`;
    const current = store.users.get(userId);
    if (current) store.users.set(userId, { ...current, avatarUrl: url, updatedAt: nowIso() });
    return delay({ avatarUrl: url });
  }

  async deleteAvatar(userId: UserId): Promise<Result<void, Error>> {
    const current = store.users.get(userId);
    if (current) store.users.set(userId, { ...current, avatarUrl: null, updatedAt: nowIso() });
    return delay(undefined);
  }

  async getPreferences(userId: UserId): Promise<Result<UserPreferences, Error>> {
    const profile = store.users.get(userId);
    return profile ? delay(profile.preferences) : err('Profile not found');
  }

  async updatePreferences(userId: UserId, preferences: UserPreferences): Promise<Result<UserPreferences, Error>> {
    const current = store.users.get(userId);
    if (!current) return err('Profile not found');
    store.users.set(userId, { ...current, preferences, updatedAt: nowIso() });
    return delay(preferences);
  }

  async getNotificationSettings(userId: UserId): Promise<Result<NotificationSettings, Error>> {
    const profile = store.users.get(userId);
    return profile ? delay(profile.notifications) : err('Profile not found');
  }

  async updateNotificationSettings(userId: UserId, settings: NotificationSettings): Promise<Result<NotificationSettings, Error>> {
    const current = store.users.get(userId);
    if (!current) return err('Profile not found');
    store.users.set(userId, { ...current, notifications: settings, updatedAt: nowIso() });
    return delay(settings);
  }

  async getPrivacySettings(userId: UserId): Promise<Result<PrivacySettings, Error>> {
    const profile = store.users.get(userId);
    return profile ? delay(profile.privacy) : err('Profile not found');
  }

  async updatePrivacySettings(userId: UserId, settings: PrivacySettings): Promise<Result<PrivacySettings, Error>> {
    const current = store.users.get(userId);
    if (!current) return err('Profile not found');
    store.users.set(userId, { ...current, privacy: settings, updatedAt: nowIso() });
    return delay(settings);
  }

  async getAccessibilitySettings(userId: UserId): Promise<Result<AccessibilitySettings, Error>> {
    const profile = store.users.get(userId);
    return profile ? delay(profile.accessibility) : err('Profile not found');
  }

  async updateAccessibilitySettings(userId: UserId, settings: AccessibilitySettings): Promise<Result<AccessibilitySettings, Error>> {
    const current = store.users.get(userId);
    if (!current) return err('Profile not found');
    store.users.set(userId, { ...current, accessibility: settings, updatedAt: nowIso() });
    return delay(settings);
  }

  async updatePresence(userId: UserId, presence: Presence): Promise<Result<Presence, Error>> {
    const current = store.users.get(userId);
    if (!current) return err('Profile not found');
    store.users.set(userId, { ...current, presence, updatedAt: nowIso() });
    return delay(presence);
  }

  async deactivateAccount(userId: UserId): Promise<Result<void, Error>> {
    const current = store.users.get(userId);
    if (current) store.users.set(userId, { ...current, status: 'deactivated', updatedAt: nowIso() });
    return delay(undefined);
  }
}

class InMemoryMeetingRepository implements MeetingRepository {
  async createMeeting(input: CreateMeetingInput): Promise<Result<Meeting, Error>> {
    const id = uid('meeting') as unknown as MeetingId;
    const meeting: Meeting = {
      id, title: input.title, description: input.description ?? null, hostId: input.hostId,
      status: 'scheduled', passcode: input.passcode ?? null, maxParticipants: input.maxParticipants ?? 100,
      settings: (input.settings ?? { waitingRoomEnabled: false, muteOnEntry: true, videoOnEntry: true, allowRecording: true, allowTranscription: false, chatEnabled: true, handRaiseEnabled: true, breakoutRoomsEnabled: false }) as MeetingSettings,
      livekitRoomName: null, startedAt: null, endedAt: null,
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    store.meetings.set(id, meeting);
    return delay(meeting);
  }

  async getMeeting(meetingId: MeetingId): Promise<Result<Meeting | null, Error>> { return delay(store.meetings.get(meetingId) ?? null); }

  async updateMeeting(meetingId: MeetingId, update: MeetingUpdate): Promise<Result<Meeting, Error>> {
    const current = store.meetings.get(meetingId);
    if (!current) return err('Meeting not found');
    const next: Meeting = {
      ...current,
      title: update.title ?? current.title,
      description: update.description ?? current.description,
      maxParticipants: update.maxParticipants ?? current.maxParticipants,
      settings: (update.settings ?? current.settings) as MeetingSettings,
      updatedAt: nowIso(),
    };
    store.meetings.set(meetingId, next);
    return delay(next);
  }

  async updateMeetingStatus(meetingId: MeetingId, status: Meeting['status']): Promise<Result<Meeting, Error>> {
    const current = store.meetings.get(meetingId);
    if (!current) return err('Meeting not found');
    const next: Meeting = {
      ...current, status,
      startedAt: status === 'active' ? current.startedAt ?? nowIso() : current.startedAt,
      endedAt: status === 'ended' ? nowIso() : current.endedAt,
      updatedAt: nowIso(),
    };
    store.meetings.set(meetingId, next);
    return delay(next);
  }

  async startMeeting(meetingId: MeetingId): Promise<Result<Meeting, Error>> { return this.updateMeetingStatus(meetingId, 'active'); }
  async endMeeting(meetingId: MeetingId): Promise<Result<Meeting, Error>> { return this.updateMeetingStatus(meetingId, 'ended'); }
  async deleteMeeting(meetingId: MeetingId): Promise<Result<void, Error>> { store.meetings.delete(meetingId); return delay(undefined); }
  async listMeetingsByHost(hostId: UserId): Promise<Result<ReadonlyArray<Meeting>, Error>> { return delay([...store.meetings.values()].filter((m) => m.hostId === hostId)); }
  async listActiveMeetings(): Promise<Result<ReadonlyArray<Meeting>, Error>> { return delay([...store.meetings.values()].filter((m) => m.status === 'active' || m.status === 'scheduled')); }
}

class InMemoryParticipantRepository implements ParticipantRepository {
  async joinMeeting(input: JoinMeetingInput): Promise<Result<Participant, Error>> {
    const meeting = store.meetings.get(input.meetingId);
    if (!meeting) return err('Meeting not found');
    if (meeting.status === 'ended') return err('Meeting has already ended');

    const id = uid('participant') as unknown as ParticipantId;
    const participant: Participant = {
      id, meetingId: input.meetingId, userId: input.userId, displayName: input.displayName,
      role: (meeting.hostId === input.userId ? 'host' : 'attendee') as ParticipantRole,
      status: 'active' as ParticipantStatus,
      isMuted: false, isVideoOn: false, isScreenSharing: false, isHandRaised: false,
      joinedAt: nowIso(), leftAt: null,
    };
    store.participants.set(id, participant);
    const set = store.participantsByMeeting.get(input.meetingId) ?? new Set<string>();
    set.add(id);
    store.participantsByMeeting.set(input.meetingId, set);
    return delay(participant);
  }

  async getParticipant(participantId: ParticipantId): Promise<Result<Participant | null, Error>> { return delay(store.participants.get(participantId) ?? null); }

  async getParticipantByMeetingAndUser(meetingId: MeetingId, userId: UserId): Promise<Result<Participant | null, Error>> {
    const found = [...store.participants.values()].find((p) => p.meetingId === meetingId && p.userId === userId);
    return delay(found ?? null);
  }

  async listParticipants(meetingId: MeetingId): Promise<Result<ReadonlyArray<Participant>, Error>> {
    const ids = store.participantsByMeeting.get(meetingId) ?? new Set<string>();
    const list = [...ids].map((id) => store.participants.get(id)).filter((p): p is Participant => Boolean(p));
    return delay(list);
  }

  async listParticipantsByStatus(meetingId: MeetingId, status: ParticipantStatus): Promise<Result<ReadonlyArray<Participant>, Error>> {
    const ids = store.participantsByMeeting.get(meetingId) ?? new Set<string>();
    const list = [...ids].map((id) => store.participants.get(id)).filter((p): p is Participant => p !== undefined && p.status === status);
    return delay(list);
  }

  async updateParticipantStatus(participantId: ParticipantId, status: ParticipantStatus): Promise<Result<Participant, Error>> {
    const current = store.participants.get(participantId);
    if (!current) return err('Participant not found');
    const next: Participant = { ...current, status, leftAt: status === 'left' ? nowIso() : current.leftAt };
    store.participants.set(participantId, next);
    return delay(next);
  }

  async updateParticipantRole(participantId: ParticipantId, role: ParticipantRole): Promise<Result<Participant, Error>> {
    const current = store.participants.get(participantId);
    if (!current) return err('Participant not found');
    const next: Participant = { ...current, role };
    store.participants.set(participantId, next);
    return delay(next);
  }

  async muteParticipant(participantId: ParticipantId, muted: boolean): Promise<Result<Participant, Error>> {
    const current = store.participants.get(participantId);
    if (!current) return err('Participant not found');
    const next: Participant = { ...current, isMuted: muted };
    store.participants.set(participantId, next);
    return delay(next);
  }

  async updateParticipantVideo(participantId: ParticipantId, videoOn: boolean): Promise<Result<Participant, Error>> {
    const current = store.participants.get(participantId);
    if (!current) return err('Participant not found');
    const next: Participant = { ...current, isVideoOn: videoOn };
    store.participants.set(participantId, next);
    return delay(next);
  }

  async updateParticipantScreenShare(participantId: ParticipantId, screenSharing: boolean): Promise<Result<Participant, Error>> {
    const current = store.participants.get(participantId);
    if (!current) return err('Participant not found');
    const next: Participant = { ...current, isScreenSharing: screenSharing };
    store.participants.set(participantId, next);
    return delay(next);
  }

  async updateParticipantHandRaised(participantId: ParticipantId, handRaised: boolean): Promise<Result<Participant, Error>> {
    const current = store.participants.get(participantId);
    if (!current) return err('Participant not found');
    const next: Participant = { ...current, isHandRaised: handRaised };
    store.participants.set(participantId, next);
    return delay(next);
  }

  async removeParticipant(participantId: ParticipantId): Promise<Result<void, Error>> {
    const current = store.participants.get(participantId);
    if (current) store.participantsByMeeting.get(current.meetingId)?.delete(participantId);
    store.participants.delete(participantId);
    return delay(undefined);
  }

  async removeAllParticipants(meetingId: MeetingId): Promise<Result<void, Error>> {
    const ids = store.participantsByMeeting.get(meetingId) ?? new Set<string>();
    for (const id of ids) store.participants.delete(id);
    store.participantsByMeeting.delete(meetingId);
    return delay(undefined);
  }

  async countActiveParticipants(meetingId: MeetingId): Promise<Result<number, Error>> {
    const ids = store.participantsByMeeting.get(meetingId) ?? new Set<string>();
    return delay([...ids].filter((id) => store.participants.get(id)?.status === 'active').length);
  }
}

// Conversation / Message repos have many unused methods. Cast through `unknown` to a
// structural type so we satisfy the interface without implementing every method.
class InMemoryConversationRepository implements ConversationRepository {
  async createConversation(input: CreateConversationInput): Promise<Result<Conversation, Error>> {
    const id = uid('conv') as unknown as ConversationId;
    const conv: Conversation = {
      id, meetingId: input.meetingId ?? null, type: input.type, name: input.name ?? null,
      status: 'active', participantIds: input.participantIds, lastMessageId: null, lastMessageAt: null,
      createdBy: input.createdBy, createdAt: nowIso(), updatedAt: nowIso(),
    };
    store.conversations.set(id, conv);
    return delay(conv);
  }

  async getConversation(conversationId: ConversationId): Promise<Result<Conversation | null, Error>> { return delay(store.conversations.get(conversationId) ?? null); }

  async getConversationByMeetingId(meetingId: MeetingId): Promise<Result<Conversation | null, Error>> {
    const found = [...store.conversations.values()].find((c) => c.meetingId === meetingId);
    return delay(found ?? null);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateConversation(conversationId: ConversationId, update: ConversationUpdate): Promise<Result<Conversation, Error>> {
    const current = store.conversations.get(conversationId);
    if (!current) return Promise.resolve(err('Conversation not found'));
    const next = { ...current, ...update, updatedAt: nowIso() } as Conversation;
    store.conversations.set(conversationId, next);
    return Promise.resolve(success(next));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  archiveConversation(conversationId: ConversationId): Promise<Result<Conversation, Error>> {
    return this.updateConversation(conversationId, { status: 'archived' });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  closeConversation(conversationId: ConversationId): Promise<Result<Conversation, Error>> {
    return this.updateConversation(conversationId, { status: 'closed' });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteConversation(conversationId: ConversationId): Promise<Result<void, Error>> {
    store.conversations.delete(conversationId);
    return Promise.resolve(success(undefined));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listConversationsByUser(userId: UserId): Promise<Result<ReadonlyArray<Conversation>, Error>> {
    return Promise.resolve(success([...store.conversations.values()].filter((c) => c.participantIds.includes(userId))));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listConversationsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<Conversation>, Error>> {
    return Promise.resolve(success([...store.conversations.values()].filter((c) => c.meetingId === meetingId)));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addParticipant(conversationId: ConversationId, userId: UserId): Promise<Result<Conversation, Error>> {
    const current = store.conversations.get(conversationId);
    if (!current) return Promise.resolve(err('Conversation not found'));
    if (!current.participantIds.includes(userId)) {
      const next = { ...current, participantIds: [...current.participantIds, userId] } as Conversation;
      store.conversations.set(conversationId, next);
      return Promise.resolve(success(next));
    }
    return Promise.resolve(success(current));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeParticipant(conversationId: ConversationId, userId: UserId): Promise<Result<Conversation, Error>> {
    const current = store.conversations.get(conversationId);
    if (!current) return Promise.resolve(err('Conversation not found'));
    const next = { ...current, participantIds: current.participantIds.filter((id) => id !== userId) } as Conversation;
    store.conversations.set(conversationId, next);
    return Promise.resolve(success(next));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateLastMessage(conversationId: ConversationId, messageId: MessageId, messageAt: import('@aimeetx/types').IsoDateString): Promise<Result<Conversation, Error>> {
    const current = store.conversations.get(conversationId);
    if (!current) return Promise.resolve(err('Conversation not found'));
    const next = { ...current, lastMessageId: messageId, lastMessageAt: messageAt } as Conversation;
    store.conversations.set(conversationId, next);
    return Promise.resolve(success(next));
  }
  // Aliases for legacy method names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findByParticipants(participantIds: ReadonlyArray<UserId>): Promise<Result<ReadonlyArray<Conversation>, Error>> {
    return Promise.resolve(success([...store.conversations.values()].filter((c) => participantIds.every((id) => c.participantIds.includes(id)))));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(conversationId: ConversationId, update: ConversationUpdate): Promise<Result<Conversation, Error>> {
    return this.updateConversation(conversationId, update);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  archive(conversationId: ConversationId): Promise<Result<Conversation, Error>> {
    return this.updateConversation(conversationId, { status: 'archived' });
  }
}

class InMemoryMessageRepository implements MessageRepository {
  async sendMessage(input: SendMessageInput): Promise<Result<Message, Error>> {
    const id = uid('msg') as unknown as MessageId;
    const msg: Message = {
      id, conversationId: input.conversationId, senderId: input.senderId,
      senderDisplayName: input.senderDisplayName, type: input.type, content: input.content,
      status: 'sent' as MessageStatus, attachments: [], replyToMessageId: input.replyToMessageId ?? null,
      editedAt: null, deletedAt: null, isDeleted: false,
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    store.messages.set(id, msg);
    return delay(msg);
  }

  async getMessage(messageId: MessageId): Promise<Result<Message | null, Error>> { return delay(store.messages.get(messageId) ?? null); }

  async editMessage(messageId: MessageId, newContent: string, _editedBy: UserId): Promise<Result<Message, Error>> {
    const current = store.messages.get(messageId);
    if (!current) return err('Message not found');
    const next: Message = { ...current, content: newContent, editedAt: nowIso(), updatedAt: nowIso() };
    store.messages.set(messageId, next);
    return delay(next);
  }

  async deleteMessage(messageId: MessageId, _deletedBy: UserId, _reason?: 'user_action' | 'moderation' | 'system'): Promise<Result<Message, Error>> {
    const current = store.messages.get(messageId);
    if (!current) return err('Message not found');
    const next: Message = { ...current, isDeleted: true, deletedAt: nowIso(), updatedAt: nowIso() };
    store.messages.set(messageId, next);
    return delay(next);
  }

  async updateMessageStatus(messageId: MessageId, status: MessageStatus): Promise<Result<Message, Error>> {
    const current = store.messages.get(messageId);
    if (!current) return err('Message not found');
    const next: Message = { ...current, status, updatedAt: nowIso() };
    store.messages.set(messageId, next);
    return delay(next);
  }

  async listMessages(conversationId: ConversationId): Promise<Result<ReadonlyArray<Message>, Error>> {
    return this.findByConversation(conversationId);
  }

  async listMessagesBySender(conversationId: ConversationId, senderId: UserId): Promise<Result<ReadonlyArray<Message>, Error>> {
    return delay(
      [...store.messages.values()].filter((m) => m.conversationId === conversationId && m.senderId === senderId && !m.isDeleted),
    );
  }

  async countUnreadMessages(_conversationId: ConversationId, _userId: UserId): Promise<Result<number, Error>> { return delay(0); }

  async subscribeToMessages(_conversationId: ConversationId, _callback: (message: Message) => void): Promise<Result<() => void, Error>> {
    return success(() => {});
  }

  async findByConversation(conversationId: ConversationId): Promise<Result<ReadonlyArray<Message>, Error>> {
    return delay(
      [...store.messages.values()].filter((m) => m.conversationId === conversationId && !m.isDeleted).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    );
  }

  async findByConversationPaginated(conversationId: ConversationId, _page: number, _pageSize: number): Promise<Result<ReadonlyArray<Message>, Error>> {
    return this.findByConversation(conversationId);
  }
}

class InMemoryClassroomRepository implements ClassroomRepository {
  async createSession(input: CreateClassroomSessionInput): Promise<Result<ClassroomSession, Error>> {
    const id = uid('classroom') as unknown as ClassroomSessionId;
    const session: ClassroomSession = {
      id, meetingId: input.meetingId, status: 'active',
      allowStudentWhiteboard: input.allowStudentWhiteboard ?? false,
      breakoutRooms: [] as ReadonlyArray<BreakoutRoom>,
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    store.classroomSessions.set(id, session);
    return delay(session);
  }

  async getSession(sessionId: ClassroomSessionId): Promise<Result<ClassroomSession | null, Error>> { return delay(store.classroomSessions.get(sessionId) ?? null); }

  async getSessionByMeetingId(meetingId: MeetingId): Promise<Result<ClassroomSession | null, Error>> {
    const found = [...store.classroomSessions.values()].find((s) => s.meetingId === meetingId);
    return delay(found ?? null);
  }

  async updateSession(sessionId: ClassroomSessionId, update: import('@aimeetx/sdk').ClassroomSessionUpdate): Promise<Result<ClassroomSession, Error>> {
    const current = store.classroomSessions.get(sessionId);
    if (!current) return err('Classroom session not found');
    const next: ClassroomSession = { ...current, ...update, updatedAt: nowIso() };
    store.classroomSessions.set(sessionId, next);
    return delay(next);
  }

  async endSession(sessionId: ClassroomSessionId): Promise<Result<ClassroomSession, Error>> {
    const current = store.classroomSessions.get(sessionId);
    if (!current) return err('Classroom session not found');
    const next: ClassroomSession = { ...current, status: 'ended', updatedAt: nowIso() };
    store.classroomSessions.set(sessionId, next);
    return delay(next);
  }
}

class InMemoryQuizRepositoryForClassroom implements QuizRepository {
  async createQuiz(input: CreateQuizInput): Promise<Result<Quiz, Error>> {
    const id = uid('quiz') as unknown as import('@aimeetx/types').QuizId;
    const quiz: Quiz = {
      id, classroomSessionId: input.classroomSessionId, question: input.question,
      options: input.options, status: 'draft', responses: [],
      correctOptionId: input.correctOptionId ?? '', showCorrectAnswer: input.showCorrectAnswer ?? false,
      createdAt: nowIso(), updatedAt: nowIso(),
    };
    store.quizzes.set(id, quiz);
    return delay(quiz);
  }

  async getQuiz(quizId: import('@aimeetx/types').QuizId): Promise<Result<Quiz | null, Error>> { return delay(store.quizzes.get(quizId) ?? null); }

  async getActiveQuizBySessionId(sessionId: ClassroomSessionId): Promise<Result<Quiz | null, Error>> {
    const found = [...store.quizzes.values()].find((q) => q.classroomSessionId === sessionId && q.status === 'active');
    return delay(found ?? null);
  }

  async updateQuizStatus(quizId: import('@aimeetx/types').QuizId, status: Quiz['status']): Promise<Result<Quiz, Error>> {
    const current = store.quizzes.get(quizId);
    if (!current) return err('Quiz not found');
    const next: Quiz = { ...current, status, updatedAt: nowIso() };
    store.quizzes.set(quizId, next);
    return delay(next);
  }

  async submitResponse(quizId: import('@aimeetx/types').QuizId, response: import('@aimeetx/sdk').QuizResponse): Promise<Result<Quiz, Error>> {
    const current = store.quizzes.get(quizId);
    if (!current) return err('Quiz not found');
    const next: Quiz = { ...current, responses: [...current.responses, response], updatedAt: nowIso() };
    store.quizzes.set(quizId, next);
    return delay(next);
  }

  async getResults(_quizId: import('@aimeetx/types').QuizId): Promise<Result<ReadonlyMap<string, number>, Error>> { return success(new Map()); }

  async deleteQuiz(quizId: import('@aimeetx/types').QuizId): Promise<Result<void, Error>> {
    store.quizzes.delete(quizId);
    return delay(undefined);
  }
}

class InMemoryAttendanceRepository implements AttendanceRepository {
  async recordJoin(input: CreateAttendanceInput): Promise<Result<AttendanceRecord, Error>> {
    const id = uid('attendance') as unknown as AttendanceId;
    const record: AttendanceRecord = {
      id, classroomSessionId: input.classroomSessionId, participantId: input.participantId,
      joinedAt: nowIso(), leftAt: null, totalDurationMinutes: 0,
    };
    store.attendance.set(id as unknown as string, record);
    return delay(record);
  }

  async recordLeave(attendanceId: AttendanceId): Promise<Result<AttendanceRecord, Error>> {
    const id = attendanceId;
    const record: AttendanceRecord = {
      id, classroomSessionId: 'classroom_unknown' as ClassroomSessionId, participantId: 'participant_unknown' as ParticipantId,
      joinedAt: nowIso(), leftAt: nowIso(), totalDurationMinutes: 30,
    };
    store.attendance.set(id as unknown as string, record);
    return delay(record);
  }

  async getRecord(attendanceId: AttendanceId): Promise<Result<AttendanceRecord | null, Error>> {
    const found = [...store.attendance.values()].find((r) => r.id === attendanceId);
    return delay(found ?? null);
  }

  async getRecordsBySessionId(sessionId: ClassroomSessionId): Promise<Result<ReadonlyArray<AttendanceRecord>, Error>> {
    return delay([...store.attendance.values()].filter((r) => r.classroomSessionId === sessionId));
  }

  async getRecordByParticipantAndSession(sessionId: ClassroomSessionId, participantId: ParticipantId): Promise<Result<AttendanceRecord | null, Error>> {
    const found = [...store.attendance.values()].find((r) => r.classroomSessionId === sessionId && r.participantId === participantId);
    return delay(found ?? null);
  }

  async exportAttendanceReport(_sessionId: ClassroomSessionId): Promise<Result<string, Error>> { return delay('participant_id,total_minutes\ndemo,0\n'); }
}

class InMemoryRecordingRepository implements RecordingRepository {
  async save(recording: MeetingRecording): Promise<Result<MeetingRecording, Error>> {
    store.recordings.set(recording.id, recording);
    return delay(recording);
  }

  async findById(id: RecordingId): Promise<Result<MeetingRecording | null, Error>> { return delay(store.recordings.get(id) ?? null); }

  async findByMeetingId(meetingId: MeetingId): Promise<Result<ReadonlyArray<MeetingRecording>, Error>> {
    return delay([...store.recordings.values()].filter((r) => r.meetingId === meetingId));
  }

  async findByStatus(status: MeetingRecording['status']): Promise<Result<ReadonlyArray<MeetingRecording>, Error>> {
    return delay([...store.recordings.values()].filter((r) => r.status === status));
  }

  async update(recording: MeetingRecording): Promise<Result<MeetingRecording, Error>> {
    store.recordings.set(recording.id, recording);
    return delay(recording);
  }

  async delete(id: RecordingId): Promise<Result<void, Error>> {
    store.recordings.delete(id);
    return delay(undefined);
  }
}

class InMemoryRecordingGateway implements RecordingGateway {
  async startEgress(): Promise<Result<string, Error>> { return success(`egress_${crypto.randomUUID()}`); }
  async stopEgress(): Promise<Result<void, Error>> { return success(undefined); }
  async getEgressStatus(): Promise<Result<EgressStatus, Error>> { return success({ egressId: 'mock', status: 'EGRESS_COMPLETE', fileResults: [] }); }
}

class InMemoryDownloadLinkGenerator implements DownloadLinkGenerator {
  async generateSignedUrl(recordingId: RecordingId): Promise<Result<{ downloadUrl: string; expiresAt: import('@aimeetx/types').IsoDateString }, Error>> {
    return success({
      downloadUrl: `/api/v1/recordings/${recordingId}/download?token=mock`,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() as import('@aimeetx/types').IsoDateString,
    });
  }
}

class InMemoryNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<Result<Notification, Error>> {
    store.notifications.set(notification.id, notification);
    return delay(notification);
  }

  async findByIdempotencyKey(key: string): Promise<Result<Notification | null, Error>> {
    const found = [...store.notifications.values()].find((n) => n.idempotencyKey === key);
    return delay(found ?? null);
  }

  async findByRecipientId(userId: UserId, page: number, pageSize: number): Promise<Result<{ items: ReadonlyArray<Notification>; totalCount: number }, Error>> {
    const all = [...store.notifications.values()].filter((n) => n.recipientId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;
    return delay({ items: all.slice(start, start + pageSize), totalCount: all.length });
  }

  async markRead(id: NotificationId): Promise<Result<Notification, Error>> {
    const current = store.notifications.get(id);
    if (!current) return err('Notification not found');
    const next: Notification = { ...current, readAt: nowIso(), status: 'sent' };
    store.notifications.set(id, next);
    return delay(next);
  }

  async clearAll(userId: UserId): Promise<Result<void, Error>> {
    for (const [key, n] of store.notifications) {
      if (n.recipientId === userId) store.notifications.delete(key);
    }
    return delay(undefined);
  }
}

class InMemoryPreferencesRepository implements PreferencesRepository {
  async findByUserId(userId: UserId): Promise<Result<UserNotificationPreferences | null, Error>> {
    const channels: ReadonlyArray<NotificationChannel> = ['push', 'email', 'sms'];
    const preferences = {
      meeting_invitation: ['email'] as ReadonlyArray<NotificationChannel>,
      rsvp_update: ['email'] as ReadonlyArray<NotificationChannel>,
      meeting_reminder: channels,
      meeting_started: ['push'] as ReadonlyArray<NotificationChannel>,
      meeting_cancelled: ['push', 'email'] as ReadonlyArray<NotificationChannel>,
      recording_ready: ['push', 'email'] as ReadonlyArray<NotificationChannel>,
      ai_report_ready: ['email'] as ReadonlyArray<NotificationChannel>,
      participant_admitted: ['push'] as ReadonlyArray<NotificationChannel>,
      speak_permission_granted: ['push'] as ReadonlyArray<NotificationChannel>,
    } as UserNotificationPreferences['preferences'];
    return delay({ userId, preferences });
  }

  async save(prefs: UserNotificationPreferences): Promise<Result<UserNotificationPreferences, Error>> { return delay(prefs); }
}

class InMemoryDeviceTokenRepository implements DeviceTokenRepository {
  async register(input: { userId: UserId; platform: DevicePlatform; token: string }): Promise<Result<DeviceToken, Error>> {
    const id = uid('device') as Uuid;
    const token: DeviceToken = {
      id: id as DeviceToken['id'], userId: input.userId, platform: input.platform, token: input.token,
      isActive: true, registeredAt: nowIso(), lastSeenAt: nowIso(),
    };
    store.deviceTokens.set(id, token);
    return delay(token);
  }

  async deregister(deviceId: Uuid): Promise<Result<void, Error>> { store.deviceTokens.delete(deviceId); return delay(undefined); }

  async findByUserId(userId: UserId): Promise<Result<ReadonlyArray<DeviceToken>, Error>> {
    return delay([...store.deviceTokens.values()].filter((t) => t.userId === userId && t.isActive));
  }
}

class InMemoryPushGateway implements PushGateway { async send(): Promise<Result<void, Error>> { return success(undefined); } }
class InMemoryEmailGateway implements EmailGateway { async send(): Promise<Result<void, Error>> { return success(undefined); } }
class InMemorySmsGateway implements SmsGateway { async send(): Promise<Result<void, Error>> { return success(undefined); } }

class InMemoryTenantRepository implements TenantRepository {
  async createTenant(input: CreateTenantInput): Promise<Result<Tenant, Error>> {
    const id = uid('tenant') as unknown as TenantId;
    const tenant: Tenant = {
      id, name: input.name, slug: input.slug, status: 'active',
      featureFlags: { ...DEFAULT_TENANT_FEATURE_FLAGS, ...(input.featureFlags ?? {}) } as TenantFeatureFlags,
      createdAt: nowIso(), updatedAt: nowIso(), suspendedAt: null,
    };
    store.tenants.set(id, tenant);
    return delay(tenant);
  }

  async getTenant(tenantId: TenantId): Promise<Result<Tenant | null, Error>> { return delay(store.tenants.get(tenantId) ?? null); }

  async suspendTenant(tenantId: TenantId): Promise<Result<Tenant, Error>> {
    const current = store.tenants.get(tenantId);
    if (!current) return err('Tenant not found');
    const next: Tenant = { ...current, status: 'suspended', suspendedAt: nowIso() };
    store.tenants.set(tenantId, next);
    return delay(next);
  }

  async updateFeatureFlags(tenantId: TenantId, featureFlags: TenantFeatureFlags): Promise<Result<Tenant, Error>> {
    const current = store.tenants.get(tenantId);
    if (!current) return err('Tenant not found');
    const next: Tenant = { ...current, featureFlags, updatedAt: nowIso() };
    store.tenants.set(tenantId, next);
    return delay(next);
  }

  async inviteMember(input: InviteTenantMemberInput): Promise<Result<TenantMember, Error>> {
    const id = uid('member') as Uuid;
    const member: TenantMember = {
      id: id as TenantMember['id'], tenantId: input.tenantId, userId: null,
      email: input.email, role: input.role as TenantMember['role'], invitedBy: input.invitedBy,
      invitedAt: nowIso(), acceptedAt: null,
    };
    store.tenantMembers.set(id, member);
    return delay(member);
  }
}

class InMemoryAuditLogRepository implements AuditLogRepository {
  async append(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<Result<AuditLogEntry, Error>> {
    const id = uid('audit') as Uuid;
    const log: AuditLogEntry = {
      id: id as AuditLogEntry['id'], tenantId: entry.tenantId, actorId: entry.actorId,
      actorRole: entry.actorRole, action: entry.action, targetId: entry.targetId,
      metadata: entry.metadata, createdAt: nowIso(),
    };
    store.auditLogs.set(id, log);
    return delay(log);
  }

  async query(query: AuditLogQuery, _actor: AdminActorClaims): Promise<Result<ReadonlyArray<AuditLogEntry>, Error>> {
    const all = [...store.auditLogs.values()].filter((log) => {
      if (query.tenantId && log.tenantId !== query.tenantId) return false;
      if (query.actorId && log.actorId !== query.actorId) return false;
      return true;
    });
    const limit = query.limit ?? all.length;
    return delay(all.slice(0, limit));
  }
}

class InMemoryMeetingFactRepository implements MeetingFactRepository {
  async insert(fact: MeetingFact): Promise<Result<MeetingFact, Error>> {
    store.meetingFacts.set(fact.meetingId, fact);
    return delay(fact);
  }

  async getByMeetingId(meetingId: MeetingId): Promise<Result<MeetingFact | null, Error>> { return delay(store.meetingFacts.get(meetingId) ?? null); }

  async update(meetingId: MeetingId, update: MeetingFactUpdate): Promise<Result<MeetingFact, Error>> {
    const current = store.meetingFacts.get(meetingId);
    if (!current) return err('Meeting fact not found');
    const next: MeetingFact = {
      ...current,
      recordingEnabled: update.recordingEnabled ?? current.recordingEnabled,
      recordingMinutes: update.recordingMinutes ?? current.recordingMinutes,
      aiEnabled: update.aiEnabled ?? current.aiEnabled,
      translationEnabled: update.translationEnabled ?? current.translationEnabled,
      translationMinutes: current.translationMinutes + (update.translationMinutesDelta ?? 0),
    };
    store.meetingFacts.set(meetingId, next);
    return delay(next);
  }

  async findByTenantAndDateRange(_tenantId: AnalyticsTenantId, _range: AnalyticsDateRange): Promise<Result<ReadonlyArray<MeetingFact>, Error>> { return delay([...store.meetingFacts.values()]); }
  async findByDateRange(_range: AnalyticsDateRange): Promise<Result<ReadonlyArray<MeetingFact>, Error>> { return delay([...store.meetingFacts.values()]); }
}

class InMemoryUserEngagementRepository implements UserEngagementRepository {
  async incrementHosted(_input: { tenantId: AnalyticsTenantId; userId: UserId; date: string }): Promise<Result<UserEngagementFact, Error>> { return err('Not implemented in mock'); }
  async incrementAttended(_input: { tenantId: AnalyticsTenantId; userId: UserId; date: string; meetingMinutes: number }): Promise<Result<UserEngagementFact, Error>> { return err('Not implemented in mock'); }
  async findByTenantAndDateRange(_tenantId: AnalyticsTenantId, _range: AnalyticsDateRange): Promise<Result<ReadonlyArray<UserEngagementFact>, Error>> { return delay([...store.engagementFacts.values()]); }
  async findActiveUsers(_range: AnalyticsDateRange): Promise<Result<ReadonlySet<UserId>, Error>> { return delay(new Set<UserId>()); }
}

class InMemoryAnalyticsSummaryRepository implements AnalyticsSummaryRepository {
  async getMeetingAnalytics(_input: { tenantId: AnalyticsTenantId; range: AnalyticsDateRange; granularity: AnalyticsGranularity }): Promise<Result<MeetingAnalyticsSummary, Error>> {
    return delay({ tenantId: 'tenant_demo' as AnalyticsTenantId, granularity: 'daily', from: '2026-01-01', to: '2026-01-31', series: [] });
  }

  async getPlatformMetrics(_range: AnalyticsDateRange): Promise<Result<PlatformMetricsSummary, Error>> {
    return delay({ from: '2026-01-01', to: '2026-01-31', dailyActiveUsers: 1240, monthlyActiveUsers: 8400, totalMeetings: 12500, totalMeetingMinutes: 750000, totalRecordingMinutes: 45000, totalTranslationMinutes: 38000 });
  }

  async upsertTenantDailySummary(summary: TenantDailySummary): Promise<Result<void, Error>> { store.tenantSummaries.set(`${summary.tenantId}:${summary.date}`, summary); return delay(undefined); }
  async upsertPlatformDailySummary(summary: PlatformDailySummary): Promise<Result<void, Error>> { store.platformSummaries.set(summary.date, summary); return delay(undefined); }
}

class InMemoryAttachmentRepository implements AttachmentRepository {
  async uploadAttachment(_input: UploadAttachmentInput): Promise<Result<Attachment, Error>> { return err('Upload not implemented in mock'); }
  async getAttachment(_attachmentId: import('@aimeetx/types').AttachmentId): Promise<Result<Attachment | null, Error>> { return delay(null); }
  async getAttachmentsByMessage(_messageId: MessageId): Promise<Result<ReadonlyArray<Attachment>, Error>> { return delay([]); }
  async getAttachmentsByConversation(_conversationId: ConversationId, _limit?: number): Promise<Result<ReadonlyArray<Attachment>, Error>> { return delay([]); }
  async updateAttachmentStatus(_attachmentId: import('@aimeetx/types').AttachmentId, _status: Attachment['status']): Promise<Result<Attachment, Error>> { return err('Not implemented'); }
  async updateAttachmentStorageUrl(_attachmentId: import('@aimeetx/types').AttachmentId, _storageUrl: string, _thumbnailUrl?: string): Promise<Result<Attachment, Error>> { return err('Not implemented'); }
  async deleteAttachment(_attachmentId: import('@aimeetx/types').AttachmentId): Promise<Result<void, Error>> { return success(undefined); }
  async getDownloadUrl(_attachmentId: import('@aimeetx/types').AttachmentId): Promise<Result<string, Error>> { return err('Not implemented'); }
}

class InMemoryReadReceiptRepository implements ReadReceiptRepository {
  async save(): Promise<Result<ReadReceipt, Error>> { return err('Not implemented'); }
  async findByUserAndConversation(): Promise<Result<ReadReceipt | null, Error>> { return success(null); }
  async markMessageRead(): Promise<Result<ReadReceipt, Error>> { return err('Not implemented'); }
  async markConversationRead(): Promise<Result<void, Error>> { return success(undefined); }
  async getReadReceipts(): Promise<Result<ReadonlyArray<ReadReceipt>, Error>> { return delay([]); }
  async getLastReadMessage(): Promise<Result<MessageId | null, Error>> { return success(null); }
  async hasUserReadMessage(_messageId: MessageId, _userId: UserId): Promise<Result<boolean, Error>> { return success(false); }
}

// ============================================================================
// AI Mock Repositories
// ============================================================================

class InMemoryMeetingSummaryRepository implements MeetingSummaryRepository {
  private readonly summaries = new Map<SummaryId, MeetingSummary>();

  async createSummary(input: CreateMeetingSummaryInput): Promise<Result<MeetingSummary, Error>> {
    const id = `summary_${Date.now()}` as SummaryId;
    const summary: MeetingSummary = { id, meetingId: input.meetingId, summaryText: input.summaryText, keyTopics: input.keyTopics, generatedAt: nowIso(), isFinal: input.isFinal };
    this.summaries.set(id, summary);
    return success(summary);
  }
  async getSummary(summaryId: SummaryId): Promise<Result<MeetingSummary | null, Error>> { return success(this.summaries.get(summaryId) ?? null); }
  async getLatestSummaryByMeeting(meetingId: MeetingId): Promise<Result<MeetingSummary | null, Error>> {
    const found = [...this.summaries.values()].filter((s) => s.meetingId === meetingId).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    return success(found[0] ?? null);
  }
  async updateSummary(summaryId: SummaryId, update: { summaryText?: string; keyTopics?: ReadonlyArray<string>; isFinal?: boolean }): Promise<Result<MeetingSummary, Error>> {
    const s = this.summaries.get(summaryId); if (!s) return failure(new Error('Summary not found'));
    const next = { ...s, ...update } as MeetingSummary;
    this.summaries.set(summaryId, next); return success(next);
  }
  async markAsFinal(summaryId: SummaryId): Promise<Result<MeetingSummary, Error>> { return this.updateSummary(summaryId, { isFinal: true }); }
  async deleteSummariesByMeeting(meetingId: MeetingId): Promise<Result<number, Error>> { let n = 0; for (const [k, v] of this.summaries) { if (v.meetingId === meetingId) { this.summaries.delete(k); n++; } } return success(n); }
}

class InMemoryActionItemRepository implements ActionItemRepository {
  private readonly items = new Map<ActionItemId, ActionItem>();

  async createActionItem(input: CreateActionItemInput): Promise<Result<ActionItem, Error>> {
    const id = `action_${Date.now()}` as ActionItemId;
    const item: ActionItem = { id, meetingId: input.meetingId, description: input.description, assignedTo: input.assignedTo, dueDate: input.dueDate, detectedAt: nowIso(), confidence: input.confidence };
    this.items.set(id, item); return success(item);
  }
  async saveAll(inputs: ReadonlyArray<CreateActionItemInput>): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    const results: ActionItem[] = []; for (const input of inputs) { const r = await this.createActionItem(input); if (r.isSuccess) results.push(r.value); } return success(results);
  }
  async getActionItem(actionItemId: ActionItemId): Promise<Result<ActionItem | null, Error>> { return success(this.items.get(actionItemId) ?? null); }
  async getActionItemsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    return success([...this.items.values()].filter((i) => i.meetingId === meetingId));
  }
  async updateActionItem(actionItemId: ActionItemId, update: { description?: string; assignedTo?: string | null; dueDate?: string | null }): Promise<Result<ActionItem, Error>> {
    const i = this.items.get(actionItemId); if (!i) return failure(new Error('Action item not found'));
    const next = { ...i, ...update } as ActionItem; this.items.set(actionItemId, next); return success(next);
  }
  async deleteActionItem(actionItemId: ActionItemId): Promise<Result<void, Error>> { this.items.delete(actionItemId); return success(undefined); }
  async deleteActionItemsByMeeting(meetingId: MeetingId): Promise<Result<number, Error>> { let n = 0; for (const [k, v] of this.items) { if (v.meetingId === meetingId) { this.items.delete(k); n++; } } return success(n); }
}

class InMemoryMeetingReportRepository implements MeetingReportRepository {
  private readonly reports = new Map<ReportId, MeetingReport>();

  async createReport(input: CreateMeetingReportInput): Promise<Result<MeetingReport, Error>> {
    const id = `report_${Date.now()}` as ReportId;
    const report: MeetingReport = { id, meetingId: input.meetingId, summary: input.summary, decisions: input.decisions, actionItems: input.actionItems, topicBreakdown: input.topicBreakdown, generatedAt: nowIso(), status: 'ready' };
    this.reports.set(id, report); return success(report);
  }
  async getReport(reportId: ReportId): Promise<Result<MeetingReport | null, Error>> { return success(this.reports.get(reportId) ?? null); }
  async getReportByMeeting(meetingId: MeetingId): Promise<Result<MeetingReport | null, Error>> {
    const found = [...this.reports.values()].filter((r) => r.meetingId === meetingId).sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    return success(found[0] ?? null);
  }
  async updateReport(reportId: ReportId, update: { summary?: string; decisions?: ReadonlyArray<string>; actionItems?: ReadonlyArray<ActionItem>; topicBreakdown?: Readonly<Record<string, number>>; status?: MeetingReport['status'] }): Promise<Result<MeetingReport, Error>> {
    const r = this.reports.get(reportId); if (!r) return failure(new Error('Report not found'));
    const next = { ...r, ...update } as MeetingReport; this.reports.set(reportId, next); return success(next);
  }
  async updateReportStatus(reportId: ReportId, status: MeetingReport['status']): Promise<Result<MeetingReport, Error>> { return this.updateReport(reportId, { status }); }
  async deleteReport(reportId: ReportId): Promise<Result<void, Error>> { this.reports.delete(reportId); return success(undefined); }
  async deleteReportsByMeeting(meetingId: MeetingId): Promise<Result<number, Error>> { let n = 0; for (const [k, v] of this.reports) { if (v.meetingId === meetingId) { this.reports.delete(k); n++; } } return success(n); }
}

class InMemoryTranscriptContextRepository implements TranscriptContextRepository {
  private readonly segments = new Map<string, TranscriptContextSegment[]>();

  async addSegment(meetingId: MeetingId, segment: TranscriptContextSegment): Promise<Result<void, Error>> {
    const arr = this.segments.get(meetingId) ?? []; arr.push(segment); this.segments.set(meetingId, arr); return success(undefined);
  }
  async getContextWindow(meetingId: MeetingId, _windowMinutes?: number): Promise<Result<MeetingTranscriptContext, Error>> {
    const segments = this.segments.get(meetingId) ?? []; return success({ meetingId, segments, windowMinutes: _windowMinutes ?? 30 });
  }
  async getAllSegments(meetingId: MeetingId): Promise<Result<ReadonlyArray<TranscriptContextSegment>, Error>> { return success(this.segments.get(meetingId) ?? []); }
  async clearContextWindow(meetingId: MeetingId): Promise<Result<number, Error>> { const n = (this.segments.get(meetingId) ?? []).length; this.segments.delete(meetingId); return success(n); }
  async getSegmentCount(meetingId: MeetingId): Promise<Result<number, Error>> { return success((this.segments.get(meetingId) ?? []).length); }
}

class InMemoryAiMeetingService implements AiMeetingService {
  async processTranscriptSegment(_meetingId: MeetingId, _segment: TranscriptContextSegment): Promise<Result<void, Error>> { return success(undefined); }
  async generateRunningSummary(meetingId: MeetingId): Promise<Result<MeetingSummary, Error>> {
    return success({ id: `` as SummaryId, meetingId, summaryText: 'In-memory AI summary: Meeting discussed key topics and action items.', keyTopics: ['discussion', 'planning'], generatedAt: nowIso(), isFinal: false });
  }
  async detectActionItems(meetingId: MeetingId): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    return success([{ id: `` as ActionItemId, meetingId, description: 'Follow up on action items', assignedTo: 'team', dueDate: null, detectedAt: nowIso(), confidence: 0.8 }]);
  }
  async answerQuestion(input: AskAiQuestionInput): Promise<Result<string, Error>> {
    return success(`Based on the meeting context: "${input.question}" - the team discussed this topic and agreed to address it in the next sprint.`);
  }
  async generatePostMeetingReport(meetingId: MeetingId): Promise<Result<MeetingReport, Error>> {
    return success({ id: `` as ReportId, meetingId, summary: 'In-memory meeting report.', decisions: ['Proceed with plan A'], actionItems: [], topicBreakdown: { planning: 50, execution: 50 }, generatedAt: nowIso(), status: 'ready' });
  }
}

// ============================================================================
// Translation Mock Repositories
// ============================================================================

class InMemoryTranslationSessionRepository implements TranslationSessionRepository {
  private readonly sessions = new Map<TranslationSessionId, TranslationSession>();

  async createSession(input: CreateTranslationSessionInput): Promise<Result<TranslationSession, Error>> {
    const id = `ts_${Date.now()}` as TranslationSessionId;
    const session: TranslationSession = { id, meetingId: input.meetingId, sourceLanguage: input.sourceLanguage, targetLanguage: input.targetLanguage, status: 'active', startedAt: nowIso(), endedAt: null, lastHeartbeatAt: nowIso(), error: null };
    this.sessions.set(id, session); return success(session);
  }
  async getSession(sessionId: TranslationSessionId): Promise<Result<TranslationSession | null, Error>> { return success(this.sessions.get(sessionId) ?? null); }
  async getActiveSessionsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<TranslationSession>, Error>> {
    return success([...this.sessions.values()].filter((s) => s.meetingId === meetingId && s.status === 'active'));
  }
  async getSessionByLanguage(meetingId: MeetingId, targetLanguage: string): Promise<Result<TranslationSession | null, Error>> {
    return success([...this.sessions.values()].find((s) => s.meetingId === meetingId && s.targetLanguage === targetLanguage) ?? null);
  }
  async updateSessionStatus(sessionId: TranslationSessionId, status: TranslationSession['status']): Promise<Result<TranslationSession, Error>> {
    const s = this.sessions.get(sessionId); if (!s) return failure(new Error('Session not found'));
    const next = { ...s, status } as TranslationSession; this.sessions.set(sessionId, next); return success(next);
  }
  async updateHeartbeat(sessionId: TranslationSessionId): Promise<Result<TranslationSession, Error>> {
    return this.updateSessionStatus(sessionId, 'active');
  }
  async terminateSession(sessionId: TranslationSessionId, reason: string): Promise<Result<TranslationSession, Error>> {
    const s = this.sessions.get(sessionId); if (!s) return failure(new Error('Session not found'));
    const next = { ...s, status: 'terminated' as const, endedAt: nowIso(), error: { code: 'UserAction', message: reason, sessionId } as unknown as TranslationSessionError } as TranslationSession;
    this.sessions.set(sessionId, next); return success(next);
  }
  async terminateAllSessionsForMeeting(meetingId: MeetingId, reason: string): Promise<Result<number, Error>> {
    let n = 0; for (const [k, v] of this.sessions) { if (v.meetingId === meetingId) { this.sessions.set(k, { ...v, status: 'terminated' as const, endedAt: nowIso() } as TranslationSession); n++; } } return success(n);
  }
  async countActiveSessions(meetingId: MeetingId): Promise<Result<number, Error>> {
    return success([...this.sessions.values()].filter((s) => s.meetingId === meetingId && s.status === 'active').length);
  }
}

class InMemoryTranscriptRepository implements TranscriptRepository {
  private readonly segments = new Map<string, TranscriptSegment[]>();

  async saveSegment(segment: TranscriptSegment): Promise<Result<TranscriptSegment, Error>> {
    const arr = this.segments.get(segment.meetingId) ?? []; arr.push(segment); this.segments.set(segment.meetingId, arr); return success(segment);
  }
  async getSegment(_segmentId: TranslationSegmentId): Promise<Result<TranscriptSegment | null, Error>> { return success(null); }
  async getSegmentsBySession(_sessionId: TranslationSessionId, _options?: { limit?: number }): Promise<Result<ReadonlyArray<TranscriptSegment>, Error>> { return success([]); }
  async getSegmentsByMeeting(meetingId: MeetingId, _options?: { limit?: number; language?: string }): Promise<Result<ReadonlyArray<TranscriptSegment>, Error>> { return success(this.segments.get(meetingId) ?? []); }
  async deleteSegmentsByMeeting(meetingId: MeetingId): Promise<Result<number, Error>> { const n = (this.segments.get(meetingId) ?? []).length; this.segments.delete(meetingId); return success(n); }
  async deleteSegmentsBySession(_sessionId: TranslationSessionId): Promise<Result<number, Error>> { return success(0); }
}

class InMemoryTranslationRouter implements TranslationRouter {
  private readonly prefs = new Map<string, TranslationLanguagePreference>();

  async addParticipantLanguagePreference(participantId: ParticipantId, meetingId: MeetingId, targetLanguage: string): Promise<Result<TranslationLanguagePreference, Error>> {
    const pref: TranslationLanguagePreference = { participantId, meetingId, targetLanguage, setAt: nowIso() };
    this.prefs.set(`${meetingId}:${participantId}`, pref); return success(pref);
  }
  async removeParticipantLanguagePreference(participantId: ParticipantId, meetingId: MeetingId): Promise<Result<TranslationLanguagePreference | null, Error>> {
    const p = this.prefs.get(`${meetingId}:${participantId}`) ?? null; this.prefs.delete(`${meetingId}:${participantId}`); return success(p);
  }
  async getParticipantLanguagePreference(participantId: ParticipantId, meetingId: MeetingId): Promise<Result<TranslationLanguagePreference | null, Error>> { return success(this.prefs.get(`${meetingId}:${participantId}`) ?? null); }
  async getListenersForLanguage(meetingId: MeetingId, targetLanguage: string): Promise<Result<ReadonlyArray<ParticipantId>, Error>> {
    return success([...this.prefs.values()].filter((p) => p.meetingId === meetingId && p.targetLanguage === targetLanguage).map((p) => p.participantId));
  }
  async getLanguagePreferencesForMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<TranslationLanguagePreference>, Error>> {
    return success([...this.prefs.values()].filter((p) => p.meetingId === meetingId));
  }
  async removeAllLanguagePreferencesForMeeting(meetingId: MeetingId): Promise<Result<number, Error>> { let n = 0; for (const [k, v] of this.prefs) { if (v.meetingId === meetingId) { this.prefs.delete(k); n++; } } return success(n); }
}

class InMemoryTranslationGateway implements TranslationGateway {
  async startSession(meetingId: MeetingId, _sourceLanguage: string, _targetLanguage: string, _callbacks?: TranslationEventCallbacks): Promise<Result<TranslationSessionId, Error>> {
    return success(`ts_gw_${Date.now()}` as TranslationSessionId);
  }
  async stopSession(_sessionId: TranslationSessionId, _reason: string): Promise<Result<void, Error>> { return success(undefined); }
  async sendAudio(_sessionId: TranslationSessionId, _audioChunk: ArrayBuffer): Promise<Result<void, Error>> { return success(undefined); }
  async broadcastAudio(_meetingId: MeetingId, _audioChunk: ArrayBuffer): Promise<Result<number, Error>> { return success(0); }
  async getSessionConfig(_sessionId: TranslationSessionId): Promise<Result<GeminiLiveTranslateConfig | null, Error>> { return success(null); }
  async isSessionActive(_sessionId: TranslationSessionId): Promise<Result<boolean, Error>> { return success(true); }
  async destroySessionData(_sessionId: TranslationSessionId): Promise<Result<void, Error>> { return success(undefined); }
}

class InMemoryTranslationPrivacyLayer implements TranslationPrivacyLayer {
  async isRecordingAllowed(_meetingId: MeetingId): Promise<Result<boolean, Error>> { return success(true); }
  async isTranscriptStorageAllowed(_meetingId: MeetingId): Promise<Result<boolean, Error>> { return success(false); }
  async destroySessionData(_sessionId: TranslationSessionId): Promise<Result<void, Error>> { return success(undefined); }
  async destroyMeetingData(_meetingId: MeetingId): Promise<Result<void, Error>> { return success(undefined); }
}

// ============================================================================
// Whiteboard Mock Repositories
// ============================================================================

class InMemoryWhiteboardRepository implements WhiteboardRepository {
  private readonly states = new Map<ClassroomSessionId, WhiteboardState>();

  async getState(sessionId: ClassroomSessionId): Promise<Result<WhiteboardState | null, Error>> {
    return success(this.states.get(sessionId) ?? null);
  }

  async saveStroke(stroke: WhiteboardStroke): Promise<Result<WhiteboardStroke, Error>> {
    let state = this.states.get(stroke.sessionId);
    if (!state) {
      state = { sessionId: stroke.sessionId, strokes: [], lastOperation: null, updatedAt: nowIso() };
    }
    const next = { ...state, strokes: [...state.strokes, stroke], updatedAt: nowIso() };
    this.states.set(stroke.sessionId, next);
    return success(stroke);
  }

  async clearStrokes(sessionId: ClassroomSessionId): Promise<Result<WhiteboardState, Error>> {
    const state = this.states.get(sessionId) ?? { sessionId, strokes: [], lastOperation: null, updatedAt: nowIso() } as WhiteboardState;
    const next = { ...state, strokes: [], updatedAt: nowIso() };
    this.states.set(sessionId, next);
    return success(next);
  }

  async undoLastStroke(sessionId: ClassroomSessionId, participantId: ParticipantId): Promise<Result<WhiteboardState, Error>> {
    const state = this.states.get(sessionId);
    if (!state) return failure(new Error('Whiteboard not found'));
    const idx = state.strokes.map((s) => s.participantId).lastIndexOf(participantId);
    if (idx === -1) return failure(new Error('No strokes to undo'));
    const next = { ...state, strokes: state.strokes.filter((_, i) => i !== idx), updatedAt: nowIso() };
    this.states.set(sessionId, next);
    return success(next);
  }

  async getStrokes(sessionId: ClassroomSessionId): Promise<Result<ReadonlyArray<WhiteboardStroke>, Error>> {
    const state = this.states.get(sessionId);
    return success(state?.strokes ?? []);
  }
}

class InMemoryWhiteboardSyncGateway implements WhiteboardSyncGateway {
  private connected = false;
  private callbacks: WhiteboardSyncCallbacks | null = null;

  async connect(sessionId: ClassroomSessionId, _participantId: ParticipantId, callbacks: WhiteboardSyncCallbacks): Promise<Result<void, Error>> {
    this.connected = true;
    this.callbacks = callbacks;
    return success(undefined);
  }

  async disconnect(): Promise<Result<void, Error>> {
    this.connected = false;
    this.callbacks = null;
    return success(undefined);
  }

  async sendOperation(operation: WhiteboardOperation): Promise<Result<void, Error>> {
    this.callbacks?.onOperation(operation);
    return success(undefined);
  }

  async requestStateSync(): Promise<Result<void, Error>> {
    return success(undefined);
  }

  async sendCursorUpdate(_x: number, _y: number): Promise<Result<void, Error>> {
    return success(undefined);
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const inMemoryRepositories = {
  auth: new InMemoryAuthRepository(),
  profile: new InMemoryProfileRepository(),
  meeting: new InMemoryMeetingRepository(),
  participant: new InMemoryParticipantRepository(),
  conversation: new InMemoryConversationRepository(),
  message: new InMemoryMessageRepository(),
  attachment: new InMemoryAttachmentRepository(),
  readReceipt: new InMemoryReadReceiptRepository(),
  classroom: new InMemoryClassroomRepository(),
  quiz: new InMemoryQuizRepositoryForClassroom(),
  attendance: new InMemoryAttendanceRepository(),
  recording: new InMemoryRecordingRepository(),
  recordingGateway: new InMemoryRecordingGateway(),
  downloadLinkGenerator: new InMemoryDownloadLinkGenerator(),
  notification: new InMemoryNotificationRepository(),
  preferences: new InMemoryPreferencesRepository(),
  deviceToken: new InMemoryDeviceTokenRepository(),
  pushGateway: new InMemoryPushGateway(),
  emailGateway: new InMemoryEmailGateway(),
  smsGateway: new InMemorySmsGateway(),
  tenant: new InMemoryTenantRepository(),
  auditLog: new InMemoryAuditLogRepository(),
  meetingFact: new InMemoryMeetingFactRepository(),
  userEngagement: new InMemoryUserEngagementRepository(),
  analyticsSummary: new InMemoryAnalyticsSummaryRepository(),
  featureFlagCache: new InMemoryFeatureFlagCache() as unknown as FeatureFlagCache,
  meetingSummary: new InMemoryMeetingSummaryRepository(),
  actionItem: new InMemoryActionItemRepository(),
  meetingReport: new InMemoryMeetingReportRepository(),
  transcriptContext: new InMemoryTranscriptContextRepository(),
  aiMeetingService: new InMemoryAiMeetingService(),
  translationSession: new InMemoryTranslationSessionRepository(),
  transcript: new InMemoryTranscriptRepository(),
  translationRouter: new InMemoryTranslationRouter(),
  translationGateway: new InMemoryTranslationGateway(),
  translationPrivacyLayer: new InMemoryTranslationPrivacyLayer(),
  whiteboard: new InMemoryWhiteboardRepository(),
  whiteboardSync: new InMemoryWhiteboardSyncGateway(),
};

export { store as inMemoryStore };
