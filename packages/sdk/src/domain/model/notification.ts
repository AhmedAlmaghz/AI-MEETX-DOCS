import type { IsoDateString, NotificationId, Uuid, UserId } from '@aimeetx/types';

export type NotificationChannel = 'push' | 'email' | 'sms';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'suppressed';

export type NotificationType =
  | 'meeting_invitation'
  | 'rsvp_update'
  | 'meeting_reminder'
  | 'meeting_started'
  | 'meeting_cancelled'
  | 'recording_ready'
  | 'ai_report_ready'
  | 'participant_admitted'
  | 'speak_permission_granted';

export interface Notification {
  readonly id: NotificationId;
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly body: string;
  readonly data: Readonly<Record<string, string>>;
  readonly status: NotificationStatus;
  readonly idempotencyKey: string;
  readonly createdAt: IsoDateString;
  readonly sentAt: IsoDateString | null;
  readonly readAt: IsoDateString | null;
}

export interface UserNotificationPreferences {
  readonly userId: UserId;
  readonly preferences: Readonly<Record<NotificationType, ReadonlyArray<NotificationChannel>>>;
}

export type DevicePlatform = 'fcm' | 'apns';

export interface DeviceToken {
  readonly id: Uuid;
  readonly userId: UserId;
  readonly platform: DevicePlatform;
  readonly token: string;
  readonly isActive: boolean;
  readonly registeredAt: IsoDateString;
  readonly lastSeenAt: IsoDateString;
}

export const NOTIFICATION_CONSTRAINTS = {
  IDEMPOTENCY_WINDOW_MS: 60_000,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PUSH_DELIVERY_TARGET_MS: 2_000,
} as const;

export const DEFAULT_NOTIFICATION_PREFERENCES: Readonly<Record<NotificationType, ReadonlyArray<NotificationChannel>>> = {
  meeting_invitation: ['email'],
  rsvp_update: ['email'],
  meeting_reminder: ['push', 'email', 'sms'],
  meeting_started: ['push'],
  meeting_cancelled: ['push', 'email'],
  recording_ready: ['push', 'email'],
  ai_report_ready: ['email'],
  participant_admitted: ['push'],
  speak_permission_granted: ['push'],
};

export function isChannelAllowed(
  type: NotificationType,
  channel: NotificationChannel,
  preferences: UserNotificationPreferences | null,
): boolean {
  if (!preferences) {
    return (DEFAULT_NOTIFICATION_PREFERENCES[type] as ReadonlyArray<NotificationChannel>).includes(channel);
  }
  const allowed = preferences.preferences[type];
  return allowed !== undefined && (allowed as ReadonlyArray<NotificationChannel>).includes(channel);
}