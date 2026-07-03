import type { NotificationId, Result, Uuid, UserId } from '@aimeetx/types';

import type {
  DevicePlatform,
  DeviceToken,
  Notification,
  UserNotificationPreferences,
} from '../model/notification.js';

export interface NotificationRepository {
  save(notification: Notification): Promise<Result<Notification, Error>>;
  findByIdempotencyKey(key: string): Promise<Result<Notification | null, Error>>;
  findByRecipientId(
    userId: UserId,
    page: number,
    pageSize: number,
  ): Promise<Result<{ readonly items: ReadonlyArray<Notification>; readonly totalCount: number }, Error>>;
  markRead(id: NotificationId): Promise<Result<Notification, Error>>;
  clearAll(userId: UserId): Promise<Result<void, Error>>;
}

export interface PreferencesRepository {
  findByUserId(userId: UserId): Promise<Result<UserNotificationPreferences | null, Error>>;
  save(preferences: UserNotificationPreferences): Promise<Result<UserNotificationPreferences, Error>>;
}

export interface DeviceTokenRepository {
  register(input: {
    readonly userId: UserId;
    readonly platform: DevicePlatform;
    readonly token: string;
  }): Promise<Result<DeviceToken, Error>>;
  deregister(deviceId: Uuid): Promise<Result<void, Error>>;
  findByUserId(userId: UserId): Promise<Result<ReadonlyArray<DeviceToken>, Error>>;
}

export interface PushGateway {
  send(deviceToken: string, title: string, body: string, data: Readonly<Record<string, string>>): Promise<Result<void, Error>>;
}

export interface EmailGateway {
  send(input: {
    readonly toEmail: string;
    readonly toName: string | null;
    readonly subject: string;
    readonly htmlBody: string;
    readonly icsAttachment: Uint8Array | null;
  }): Promise<Result<void, Error>>;
}

export interface SmsGateway {
  send(phoneNumber: string, body: string): Promise<Result<void, Error>>;
}