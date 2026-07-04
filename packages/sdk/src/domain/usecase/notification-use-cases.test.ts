import 'reflect-metadata';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { IsoDateString, NotificationId, Uuid, UserId } from '@aimeetx/types';
import { success } from '@aimeetx/types';

import type {
  DeviceToken,
  Notification,
  UserNotificationPreferences,
} from '../model/notification.js';
import type {
  DeviceTokenRepository,
  EmailGateway,
  NotificationRepository,
  PreferencesRepository,
  PushGateway,
  SmsGateway,
} from '../port/notification-repository.js';
import {
  ClearNotificationsUseCase,
  DeregisterDeviceTokenUseCase,
  GetNotificationHistoryUseCase,
  MarkReadUseCase,
  RegisterDeviceTokenUseCase,
  SendNotificationUseCase,
  UpdateNotificationPreferencesUseCase,
} from './notification-use-cases.js';

const userId = 'user_notif' as UserId;
const notifId = 'notif_123' as NotificationId;
const deviceId = 'device_123' as Uuid;
const now = '2026-01-01T10:00:00.000Z' as IsoDateString;

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: notifId,
    recipientId: userId,
    type: 'meeting_reminder',
    channel: 'push',
    title: 'Reminder',
    body: 'Meeting in 15 min',
    data: {},
    status: 'sent',
    idempotencyKey: 'key_123',
    createdAt: now,
    sentAt: now,
    readAt: null,
    ...overrides,
  };
}

function createNotificationRepository(): NotificationRepository {
  return {
    save: vi.fn(),
    findByIdempotencyKey: vi.fn(),
    findByRecipientId: vi.fn(),
    markRead: vi.fn(),
    clearAll: vi.fn(),
  };
}

function createPreferencesRepository(): PreferencesRepository {
  return {
    findByUserId: vi.fn(),
    save: vi.fn(),
  };
}

function createPushGateway(): PushGateway {
  return { send: vi.fn() };
}

function createEmailGateway(): EmailGateway {
  return { send: vi.fn() };
}

function createSmsGateway(): SmsGateway {
  return { send: vi.fn() };
}

function createDeviceTokenRepository(): DeviceTokenRepository {
  return {
    register: vi.fn(),
    deregister: vi.fn(),
    findByUserId: vi.fn(),
  };
}

describe('Phase 10 notification idempotency', () => {
  let notificationRepository: NotificationRepository;
  let preferencesRepository: PreferencesRepository;
  let pushGateway: PushGateway;
  let emailGateway: EmailGateway;
  let smsGateway: SmsGateway;
  let deviceTokenRepository: DeviceTokenRepository;

  beforeEach(() => {
    notificationRepository = createNotificationRepository();
    preferencesRepository = createPreferencesRepository();
    pushGateway = createPushGateway();
    emailGateway = createEmailGateway();
    smsGateway = createSmsGateway();
    deviceTokenRepository = createDeviceTokenRepository();
  });

  it('suppresses duplicate notification within 60-second idempotency window', async () => {
    const recentSentAt = new Date(Date.now() - 30_000).toISOString() as IsoDateString;
    vi.mocked(notificationRepository.findByIdempotencyKey).mockResolvedValue(
      success(createNotification({ sentAt: recentSentAt })),
    );

    const useCase = new SendNotificationUseCase(
      notificationRepository,
      preferencesRepository,
      pushGateway,
      emailGateway,
      smsGateway,
      deviceTokenRepository,
    );

    const result = await useCase.execute({
      recipientId: userId,
      type: 'meeting_reminder',
      title: 'Reminder',
      body: 'Meeting in 15 min',
      channels: ['push'],
      idempotencyKey: 'key_123',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value).toHaveLength(1);
    expect(pushGateway.send).not.toHaveBeenCalled();
  });

  it('sends notification when idempotency window has expired', async () => {
    const oldSentAt = new Date(Date.now() - 120_000).toISOString() as IsoDateString;
    vi.mocked(notificationRepository.findByIdempotencyKey).mockResolvedValue(
      success(createNotification({ sentAt: oldSentAt })),
    );
    vi.mocked(preferencesRepository.findByUserId).mockResolvedValue(success(null));
    vi.mocked(deviceTokenRepository.findByUserId).mockResolvedValue(success([]));
    vi.mocked(notificationRepository.save).mockImplementation(async (n) => success(n));
    vi.mocked(emailGateway.send).mockResolvedValue(success(undefined));

    const useCase = new SendNotificationUseCase(
      notificationRepository,
      preferencesRepository,
      pushGateway,
      emailGateway,
      smsGateway,
      deviceTokenRepository,
    );

    const result = await useCase.execute({
      recipientId: userId,
      type: 'meeting_reminder',
      title: 'Reminder',
      body: 'Meeting in 15 min',
      channels: ['email'],
      idempotencyKey: 'key_123',
      recipientEmail: 'user@example.com',
    });

    expect(result.isSuccess).toBe(true);
    expect(emailGateway.send).toHaveBeenCalledTimes(1);
  });

  it('sends notification when no idempotency record exists', async () => {
    vi.mocked(notificationRepository.findByIdempotencyKey).mockResolvedValue(success(null));
    vi.mocked(preferencesRepository.findByUserId).mockResolvedValue(success(null));
    vi.mocked(deviceTokenRepository.findByUserId).mockResolvedValue(success([]));
    vi.mocked(notificationRepository.save).mockImplementation(async (n) => success(n));
    vi.mocked(emailGateway.send).mockResolvedValue(success(undefined));

    const useCase = new SendNotificationUseCase(
      notificationRepository,
      preferencesRepository,
      pushGateway,
      emailGateway,
      smsGateway,
      deviceTokenRepository,
    );

    const result = await useCase.execute({
      recipientId: userId,
      type: 'meeting_reminder',
      title: 'Reminder',
      body: 'Meeting in 15 min',
      channels: ['email'],
      idempotencyKey: 'key_new',
      recipientEmail: 'user@example.com',
    });

    expect(result.isSuccess).toBe(true);
    expect(emailGateway.send).toHaveBeenCalledTimes(1);
  });
});

describe('Phase 10 notification preference filtering', () => {
  let notificationRepository: NotificationRepository;
  let preferencesRepository: PreferencesRepository;
  let pushGateway: PushGateway;
  let emailGateway: EmailGateway;
  let smsGateway: SmsGateway;
  let deviceTokenRepository: DeviceTokenRepository;

  beforeEach(() => {
    notificationRepository = createNotificationRepository();
    preferencesRepository = createPreferencesRepository();
    pushGateway = createPushGateway();
    emailGateway = createEmailGateway();
    smsGateway = createSmsGateway();
    deviceTokenRepository = createDeviceTokenRepository();

    vi.mocked(notificationRepository.findByIdempotencyKey).mockResolvedValue(success(null));
    vi.mocked(deviceTokenRepository.findByUserId).mockResolvedValue(success([]));
    vi.mocked(notificationRepository.save).mockImplementation(async (n) => success(n));
  });

  it('skips EMAIL channel when user has disabled it for meeting_reminder', async () => {
    const prefs: UserNotificationPreferences = {
      userId,
      preferences: { meeting_reminder: ['push'] },
    };
    vi.mocked(preferencesRepository.findByUserId).mockResolvedValue(success(prefs));
    vi.mocked(pushGateway.send).mockResolvedValue(success(undefined));
    vi.mocked(deviceTokenRepository.findByUserId).mockResolvedValue(
      success([
        {
          id: deviceId,
          userId,
          platform: 'fcm',
          token: 'fcm_token_abc12345678',
          isActive: true,
          registeredAt: now,
          lastSeenAt: now,
        },
      ]),
    );

    const useCase = new SendNotificationUseCase(
      notificationRepository,
      preferencesRepository,
      pushGateway,
      emailGateway,
      smsGateway,
      deviceTokenRepository,
    );

    const result = await useCase.execute({
      recipientId: userId,
      type: 'meeting_reminder',
      title: 'Reminder',
      body: 'Meeting soon',
      channels: ['push', 'email'],
      idempotencyKey: 'key_pref_1',
      recipientEmail: 'user@example.com',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].channel).toBe('push');
    }
    expect(emailGateway.send).not.toHaveBeenCalled();
  });

  it('supresses all channels when user has no allowed channels for type', async () => {
    const prefs: UserNotificationPreferences = {
      userId,
      preferences: { meeting_started: [] },
    };
    vi.mocked(preferencesRepository.findByUserId).mockResolvedValue(success(prefs));

    const useCase = new SendNotificationUseCase(
      notificationRepository,
      preferencesRepository,
      pushGateway,
      emailGateway,
      smsGateway,
      deviceTokenRepository,
    );

    const result = await useCase.execute({
      recipientId: userId,
      type: 'meeting_started',
      title: 'Meeting Started',
      body: 'The meeting has started',
      channels: ['push'],
      idempotencyKey: 'key_pref_2',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value[0].status).toBe('suppressed');
    }
    expect(pushGateway.send).not.toHaveBeenCalled();
  });
});

describe('Phase 10 notification history and management', () => {
  let notificationRepository: NotificationRepository;
  let preferencesRepository: PreferencesRepository;

  beforeEach(() => {
    notificationRepository = createNotificationRepository();
    preferencesRepository = createPreferencesRepository();
  });

  it('marks a notification as read', async () => {
    vi.mocked(notificationRepository.markRead).mockResolvedValue(
      success(createNotification({ readAt: now })),
    );

    const useCase = new MarkReadUseCase(notificationRepository);
    const result = await useCase.execute({ userId, notificationId: notifId });

    expect(result.isSuccess).toBe(true);
    expect(notificationRepository.markRead).toHaveBeenCalledWith(notifId);
  });

  it('clears all notifications for a user', async () => {
    vi.mocked(notificationRepository.clearAll).mockResolvedValue(success(undefined));

    const useCase = new ClearNotificationsUseCase(notificationRepository);
    const result = await useCase.execute({ userId });

    expect(result.isSuccess).toBe(true);
    expect(notificationRepository.clearAll).toHaveBeenCalledWith(userId);
  });

  it('gets notification history with pagination', async () => {
    vi.mocked(notificationRepository.findByRecipientId).mockResolvedValue(
      success({ items: [createNotification()], totalCount: 42 }),
    );

    const useCase = new GetNotificationHistoryUseCase(notificationRepository);
    const result = await useCase.execute({ userId, page: 1, pageSize: 20 });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.totalCount).toBe(42);
  });

  it('rejects invalid page size', async () => {
    const useCase = new GetNotificationHistoryUseCase(notificationRepository);
    const result = await useCase.execute({ userId, pageSize: 200 });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('Page size');
  });

  it('updates notification preferences', async () => {
    vi.mocked(preferencesRepository.save).mockImplementation(async (prefs) => success(prefs));

    const useCase = new UpdateNotificationPreferencesUseCase(preferencesRepository);
    const result = await useCase.execute({
      userId,
      preferences: { meeting_reminder: ['push'] },
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.preferences.meeting_reminder).toEqual(['push']);
  });
});

describe('Phase 10 device token registration', () => {
  let deviceTokenRepository: DeviceTokenRepository;

  beforeEach(() => {
    deviceTokenRepository = createDeviceTokenRepository();
  });

  it('registers a valid device token', async () => {
    const token: DeviceToken = {
      id: deviceId,
      userId,
      platform: 'fcm',
      token: 'fcm_token_valid_abc123456789',
      isActive: true,
      registeredAt: now,
      lastSeenAt: now,
    };
    vi.mocked(deviceTokenRepository.register).mockResolvedValue(success(token));

    const useCase = new RegisterDeviceTokenUseCase(deviceTokenRepository);
    const result = await useCase.execute({
      userId,
      platform: 'fcm',
      token: 'fcm_token_valid_abc123456789',
    });

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.token).toBe('fcm_token_valid_abc123456789');
  });

  it('rejects an invalid device token', async () => {
    const useCase = new RegisterDeviceTokenUseCase(deviceTokenRepository);
    const result = await useCase.execute({ userId, platform: 'fcm', token: 'short' });

    expect(result.isFailure).toBe(true);
    if (result.isFailure) expect(result.error.message).toContain('Invalid');
    expect(deviceTokenRepository.register).not.toHaveBeenCalled();
  });

  it('deregisters a device token', async () => {
    vi.mocked(deviceTokenRepository.deregister).mockResolvedValue(success(undefined));

    const useCase = new DeregisterDeviceTokenUseCase(deviceTokenRepository);
    const result = await useCase.execute({ deviceId });

    expect(result.isSuccess).toBe(true);
    expect(deviceTokenRepository.deregister).toHaveBeenCalledWith(deviceId);
  });
});