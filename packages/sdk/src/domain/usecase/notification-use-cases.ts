import { inject, injectable } from 'tsyringe';

import type { NotificationId, Result, UserId, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  DevicePlatform,
  DeviceToken,
  Notification,
  NotificationChannel,
  NotificationStatus,
  NotificationType,
  UserNotificationPreferences,
} from '../model/notification.js';
import {
  isChannelAllowed,
  NOTIFICATION_CONSTRAINTS,
} from '../model/notification.js';
import type {
  DeviceTokenRepository,
  EmailGateway,
  NotificationRepository,
  PreferencesRepository,
  PushGateway,
  SmsGateway,
} from '../port/notification-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

function generateNotificationId(): NotificationId {
  return `notif_${crypto.randomUUID()}` as NotificationId;
}

// ============================================================================
// SendNotificationUseCase
// ============================================================================

export interface SendNotificationCommand {
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly title: string;
  readonly body: string;
  readonly channels: ReadonlyArray<NotificationChannel>;
  readonly data?: Readonly<Record<string, string>>;
  readonly idempotencyKey: string;
  readonly recipientEmail?: string;
  readonly recipientPhone?: string;
}

@injectable()
export class SendNotificationUseCase implements UseCase<SendNotificationCommand, ReadonlyArray<Notification>, Error> {
  constructor(
    @inject(TOKENS.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
    @inject(TOKENS.PreferencesRepository)
    private readonly preferencesRepository: PreferencesRepository,
    @inject(TOKENS.PushGateway)
    private readonly pushGateway: PushGateway,
    @inject(TOKENS.EmailGateway)
    private readonly emailGateway: EmailGateway,
    @inject(TOKENS.SmsGateway)
    private readonly smsGateway: SmsGateway,
    @inject(TOKENS.DeviceTokenRepository)
    private readonly deviceTokenRepository: DeviceTokenRepository,
  ) {}

  async execute(command: SendNotificationCommand): Promise<Result<ReadonlyArray<Notification>, Error>> {
    const idempotencyResult = await this.notificationRepository.findByIdempotencyKey(command.idempotencyKey);
    if (idempotencyResult.isFailure) return failure(idempotencyResult.error);

    if (idempotencyResult.value) {
      const existing = idempotencyResult.value;
      const now = Date.now();
      const sentAt = existing.sentAt ? new Date(existing.sentAt).getTime() : 0;
      if (now - sentAt < NOTIFICATION_CONSTRAINTS.IDEMPOTENCY_WINDOW_MS) {
        return success([existing]);
      }
    }

    const prefsResult = await this.preferencesRepository.findByUserId(command.recipientId);
    if (prefsResult.isFailure) return failure(prefsResult.error);

    const preferences = prefsResult.value;

    const allowedChannels = command.channels.filter((channel) =>
      isChannelAllowed(command.type, channel, preferences),
    );

    if (allowedChannels.length === 0) {
      const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
      const suppressed: Notification = {
        id: generateNotificationId(),
        recipientId: command.recipientId,
        type: command.type,
        channel: command.channels[0] ?? 'push',
        title: command.title,
        body: command.body,
        data: command.data ?? {},
        status: 'suppressed',
        idempotencyKey: command.idempotencyKey,
        createdAt: now,
        sentAt: null,
        readAt: null,
      };
      const saveResult = await this.notificationRepository.save(suppressed);
      if (saveResult.isFailure) return failure(saveResult.error);
      return success([saveResult.value]);
    }

    const results: Notification[] = [];

    for (const channel of allowedChannels) {
      const now = new Date().toISOString() as import('@aimeetx/types').IsoDateString;
      const notification: Notification = {
        id: generateNotificationId(),
        recipientId: command.recipientId,
        type: command.type,
        channel,
        title: command.title,
        body: command.body,
        data: command.data ?? {},
        status: 'pending',
        idempotencyKey: `${command.idempotencyKey}:${channel}`,
        createdAt: now,
        sentAt: null,
        readAt: null,
      };

      let sendOk = true;

      if (channel === 'push') {
        const tokensResult = await this.deviceTokenRepository.findByUserId(command.recipientId);
        if (tokensResult.isFailure) {
          sendOk = false;
        } else {
          for (const token of tokensResult.value) {
            const pushResult = await this.pushGateway.send(token.token, command.title, command.body, command.data ?? {});
            if (pushResult.isFailure) {
              sendOk = false;
            }
          }
        }
      } else if (channel === 'email' && command.recipientEmail) {
        const emailResult = await this.emailGateway.send({
          toEmail: command.recipientEmail,
          toName: null,
          subject: command.title,
          htmlBody: command.body,
          icsAttachment: null,
        });
        if (emailResult.isFailure) sendOk = false;
      } else if (channel === 'sms' && command.recipientPhone) {
        const smsResult = await this.smsGateway.send(command.recipientPhone, command.body);
        if (smsResult.isFailure) sendOk = false;
      } else {
        sendOk = false;
      }

      const finalStatus: NotificationStatus = sendOk ? 'sent' : 'failed';
      const sentAt = sendOk
        ? (new Date().toISOString() as import('@aimeetx/types').IsoDateString)
        : null;

      const finalNotification: Notification = {
        ...notification,
        status: finalStatus,
        sentAt,
      };

      const saveResult = await this.notificationRepository.save(finalNotification);
      if (saveResult.isFailure) return failure(saveResult.error);
      results.push(saveResult.value);
    }

    return success(results);
  }
}

// ============================================================================
// MarkReadUseCase
// ============================================================================

export interface MarkReadCommand {
  readonly userId: UserId;
  readonly notificationId: NotificationId;
}

@injectable()
export class MarkReadUseCase implements UseCase<MarkReadCommand, Notification, Error> {
  constructor(
    @inject(TOKENS.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(command: MarkReadCommand): Promise<Result<Notification, Error>> {
    return this.notificationRepository.markRead(command.notificationId);
  }
}

// ============================================================================
// ClearNotificationsUseCase
// ============================================================================

export interface ClearNotificationsCommand {
  readonly userId: UserId;
}

@injectable()
export class ClearNotificationsUseCase implements UseCase<ClearNotificationsCommand, void, Error> {
  constructor(
    @inject(TOKENS.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(command: ClearNotificationsCommand): Promise<Result<void, Error>> {
    return this.notificationRepository.clearAll(command.userId);
  }
}

// ============================================================================
// GetNotificationHistoryUseCase
// ============================================================================

export interface GetNotificationHistoryCommand {
  readonly userId: UserId;
  readonly page?: number;
  readonly pageSize?: number;
}

@injectable()
export class GetNotificationHistoryUseCase
  implements UseCase<GetNotificationHistoryCommand, { readonly items: ReadonlyArray<Notification>; readonly totalCount: number }, Error>
{
  constructor(
    @inject(TOKENS.NotificationRepository)
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(command: GetNotificationHistoryCommand): Promise<Result<{ readonly items: ReadonlyArray<Notification>; readonly totalCount: number }, Error>> {
    const page = command.page ?? 1;
    const pageSize = command.pageSize ?? NOTIFICATION_CONSTRAINTS.DEFAULT_PAGE_SIZE;

    if (page < 1) return failure(new Error('Page must be at least 1'));
    if (pageSize < 1 || pageSize > NOTIFICATION_CONSTRAINTS.MAX_PAGE_SIZE) {
      return failure(new Error(`Page size must be between 1 and ${NOTIFICATION_CONSTRAINTS.MAX_PAGE_SIZE}`));
    }

    return this.notificationRepository.findByRecipientId(command.userId, page, pageSize);
  }
}

// ============================================================================
// UpdateNotificationPreferencesUseCase
// ============================================================================

export interface UpdateNotificationPreferencesCommand {
  readonly userId: UserId;
  readonly preferences: Readonly<Record<NotificationType, ReadonlyArray<NotificationChannel>>>;
}

@injectable()
export class UpdateNotificationPreferencesUseCase
  implements UseCase<UpdateNotificationPreferencesCommand, UserNotificationPreferences, Error>
{
  constructor(
    @inject(TOKENS.PreferencesRepository)
    private readonly preferencesRepository: PreferencesRepository,
  ) {}

  async execute(command: UpdateNotificationPreferencesCommand): Promise<Result<UserNotificationPreferences, Error>> {
    const prefs: UserNotificationPreferences = {
      userId: command.userId,
      preferences: command.preferences,
    };
    return this.preferencesRepository.save(prefs);
  }
}

// ============================================================================
// RegisterDeviceTokenUseCase
// ============================================================================

export interface RegisterDeviceTokenCommand {
  readonly userId: UserId;
  readonly platform: DevicePlatform;
  readonly token: string;
}

@injectable()
export class RegisterDeviceTokenUseCase implements UseCase<RegisterDeviceTokenCommand, DeviceToken, Error> {
  constructor(
    @inject(TOKENS.DeviceTokenRepository)
    private readonly deviceTokenRepository: DeviceTokenRepository,
  ) {}

  async execute(command: RegisterDeviceTokenCommand): Promise<Result<DeviceToken, Error>> {
    if (!command.token || command.token.length < 10) {
      return failure(new Error('Invalid device token'));
    }
    return this.deviceTokenRepository.register({
      userId: command.userId,
      platform: command.platform,
      token: command.token,
    });
  }
}

// ============================================================================
// DeregisterDeviceTokenUseCase
// ============================================================================

export interface DeregisterDeviceTokenCommand {
  readonly deviceId: Uuid;
}

@injectable()
export class DeregisterDeviceTokenUseCase implements UseCase<DeregisterDeviceTokenCommand, void, Error> {
  constructor(
    @inject(TOKENS.DeviceTokenRepository)
    private readonly deviceTokenRepository: DeviceTokenRepository,
  ) {}

  async execute(command: DeregisterDeviceTokenCommand): Promise<Result<void, Error>> {
    return this.deviceTokenRepository.deregister(command.deviceId);
  }
}