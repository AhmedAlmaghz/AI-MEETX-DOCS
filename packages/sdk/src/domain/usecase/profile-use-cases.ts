import { inject, injectable } from 'tsyringe';

import type { Result, UserId, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type {
  AccessibilitySettings,
  NotificationSettings,
  Presence,
  PrivacySettings,
  Theme,
  UserPreferences,
  UserProfile,
} from '../model/profile.js';
import { AVATAR_CONSTRAINTS } from '../model/profile.js';
import type { AvatarUpload, ProfileUpdate } from '../port/profile-repository.js';
import type { ProfileRepository } from '../port/profile-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate a display name.
 *
 * Per `feature-profile/SPECIFICATION.md`: 3-50 characters, Unicode letters, numbers, spaces.
 */
function validateDisplayName(name: string): string | null {
  if (name.length < AVATAR_CONSTRAINTS.MIN_DISPLAY_NAME_LENGTH) {
    return `Display name must be at least ${AVATAR_CONSTRAINTS.MIN_DISPLAY_NAME_LENGTH} characters`;
  }
  if (name.length > AVATAR_CONSTRAINTS.MAX_DISPLAY_NAME_LENGTH) {
    return `Display name must be at most ${AVATAR_CONSTRAINTS.MAX_DISPLAY_NAME_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate an ISO-639-1 language code.
 */
function validateLanguage(language: string): boolean {
  return /^[a-z]{2}$/.test(language);
}

/**
 * Validate a theme value.
 */
function validateTheme(theme: string): theme is Theme {
  return theme === 'light' || theme === 'dark' || theme === 'system';
}

/**
 * Validate an avatar upload.
 */
function validateAvatar(avatar: AvatarUpload): string | null {
  if (avatar.file.size > AVATAR_CONSTRAINTS.MAX_SIZE_BYTES) {
    return `Avatar file is too large. Maximum size is ${AVATAR_CONSTRAINTS.MAX_SIZE_BYTES} bytes`;
  }
  if (!(AVATAR_CONSTRAINTS.SUPPORTED_FORMATS as ReadonlyArray<string>).includes(avatar.mimeType)) {
    return `Unsupported avatar format: ${avatar.mimeType}. Supported formats: ${AVATAR_CONSTRAINTS.SUPPORTED_FORMATS.join(', ')}`;
  }
  return null;
}

/**
 * Build a domain event envelope.
 */
function buildEvent<T extends string>(
  eventType: T,
  sourceModule: string,
  payload: Readonly<Record<string, unknown>>,
): {
  eventId: Uuid;
  eventType: T;
  version: number;
  timestamp: import('@aimeetx/types').IsoDateString;
  sourceModule: string;
  correlationId: Uuid;
  payload: Readonly<Record<string, unknown>>;
} {
  return {
    eventId: crypto.randomUUID() as Uuid,
    eventType,
    version: 1,
    timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
    sourceModule,
    correlationId: crypto.randomUUID() as Uuid,
    payload,
  };
}

// ============================================================================
// GetProfileUseCase
// ============================================================================

/**
 * Command for GetProfileUseCase.
 */
export interface GetProfileCommand {
  readonly userId: UserId;
}

/**
 * GetProfileUseCase — retrieves the current user's profile.
 *
 * Per `feature-profile/SPECIFICATION.md`: returns the current authenticated user's profile.
 */
@injectable()
export class GetProfileUseCase implements UseCase<GetProfileCommand, UserProfile, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(command: GetProfileCommand): Promise<Result<UserProfile, Error>> {
    const result = await this.profileRepository.getProfile(command.userId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// UpdateProfileUseCase
// ============================================================================

/**
 * Command for UpdateProfileUseCase.
 */
export interface UpdateProfileCommand {
  readonly userId: UserId;
  readonly update: ProfileUpdate;
}

/**
 * UpdateProfileUseCase — updates editable profile fields.
 *
 * Per `feature-profile/SPECIFICATION.md`: editable fields are display name, avatar, preferred language.
 */
@injectable()
export class UpdateProfileUseCase implements UseCase<UpdateProfileCommand, UserProfile, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<Result<UserProfile, Error>> {
    const { userId, update } = command;

    // Validate display name if provided
    if (update.displayName !== undefined) {
      const error = validateDisplayName(update.displayName);
      if (error) return failure(new Error(error));
    }

    // Validate languages if provided
    if (update.preferredLanguage !== undefined && !validateLanguage(update.preferredLanguage)) {
      return failure(new Error(`Invalid preferred language: ${update.preferredLanguage}`));
    }
    if (update.translationLanguage !== undefined && !validateLanguage(update.translationLanguage)) {
      return failure(new Error(`Invalid translation language: ${update.translationLanguage}`));
    }
    if (update.subtitleLanguage !== undefined && !validateLanguage(update.subtitleLanguage)) {
      return failure(new Error(`Invalid subtitle language: ${update.subtitleLanguage}`));
    }

    // Validate theme if provided
    if (update.theme !== undefined && !validateTheme(update.theme)) {
      return failure(new Error(`Invalid theme: ${update.theme}`));
    }

    // Update profile
    const result = await this.profileRepository.updateProfile(userId, update);
    if (result.isFailure) {
      return failure(result.error);
    }

    const profile = result.value;

    // Publish ProfileUpdatedEvent
    const updatedFields = Object.keys(update);
    this.eventBus.publish(
      buildEvent('ProfileUpdated', '@aimeetx/sdk/profile', {
        userId,
        updatedFields,
        timestamp: new Date().toISOString(),
      }),
    );

    // Publish specific events for language/theme changes
    if (update.preferredLanguage !== undefined) {
      this.eventBus.publish(
        buildEvent('LanguageChanged', '@aimeetx/sdk/profile', {
          userId,
          language: update.preferredLanguage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
    if (update.translationLanguage !== undefined) {
      this.eventBus.publish(
        buildEvent('TranslationLanguageChanged', '@aimeetx/sdk/profile', {
          userId,
          translationLanguage: update.translationLanguage,
          timestamp: new Date().toISOString(),
        }),
      );
    }
    if (update.theme !== undefined) {
      this.eventBus.publish(
        buildEvent('ThemeChanged', '@aimeetx/sdk/profile', {
          userId,
          theme: update.theme,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    return success(profile);
  }
}

// ============================================================================
// UploadAvatarUseCase
// ============================================================================

/**
 * Command for UploadAvatarUseCase.
 */
export interface UploadAvatarCommand {
  readonly userId: UserId;
  readonly avatar: AvatarUpload;
}

/**
 * UploadAvatarUseCase — uploads a new avatar.
 *
 * Per `feature-profile/SPECIFICATION.md`: max 10MB, PNG/JPEG/WEBP.
 */
@injectable()
export class UploadAvatarUseCase implements UseCase<UploadAvatarCommand, string, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UploadAvatarCommand): Promise<Result<string, Error>> {
    const { userId, avatar } = command;

    // Validate avatar
    const validationError = validateAvatar(avatar);
    if (validationError) {
      return failure(new Error(validationError));
    }

    // Upload avatar
    const result = await this.profileRepository.uploadAvatar(userId, avatar);
    if (result.isFailure) {
      return failure(result.error);
    }

    const { avatarUrl } = result.value;

    // Publish AvatarUpdatedEvent
    this.eventBus.publish(
      buildEvent('AvatarUpdated', '@aimeetx/sdk/profile', {
        userId,
        avatarUrl,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(avatarUrl);
  }
}

// ============================================================================
// DeleteAvatarUseCase
// ============================================================================

/**
 * Command for DeleteAvatarUseCase.
 */
export interface DeleteAvatarCommand {
  readonly userId: UserId;
}

/**
 * DeleteAvatarUseCase — deletes the current avatar.
 */
@injectable()
export class DeleteAvatarUseCase implements UseCase<DeleteAvatarCommand, void, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteAvatarCommand): Promise<Result<void, Error>> {
    const result = await this.profileRepository.deleteAvatar(command.userId);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish AvatarRemovedEvent
    this.eventBus.publish(
      buildEvent('AvatarRemoved', '@aimeetx/sdk/profile', {
        userId: command.userId,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(undefined);
  }
}

// ============================================================================
// UpdateLanguagePreferenceUseCase
// ============================================================================

/**
 * Command for UpdateLanguagePreferenceUseCase.
 */
export interface UpdateLanguagePreferenceCommand {
  readonly userId: UserId;
  readonly language: string;
  readonly translationLanguage?: string;
  readonly subtitleLanguage?: string;
}

/**
 * UpdateLanguagePreferenceUseCase — updates language preferences.
 *
 * Per `feature-profile/SPECIFICATION.md`: changing language SHALL trigger resource reload.
 */
@injectable()
export class UpdateLanguagePreferenceUseCase
  implements UseCase<UpdateLanguagePreferenceCommand, UserPreferences, Error>
{
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateLanguagePreferenceCommand): Promise<Result<UserPreferences, Error>> {
    const { userId, language, translationLanguage, subtitleLanguage } = command;

    // Validate language
    if (!validateLanguage(language)) {
      return failure(new Error(`Invalid language: ${language}`));
    }
    if (translationLanguage !== undefined && !validateLanguage(translationLanguage)) {
      return failure(new Error(`Invalid translation language: ${translationLanguage}`));
    }
    if (subtitleLanguage !== undefined && !validateLanguage(subtitleLanguage)) {
      return failure(new Error(`Invalid subtitle language: ${subtitleLanguage}`));
    }

    // Get current preferences
    const currentResult = await this.profileRepository.getPreferences(userId);
    if (currentResult.isFailure) {
      return failure(currentResult.error);
    }

    const newPreferences: UserPreferences = {
      theme: currentResult.value.theme,
      language,
      translationLanguage: translationLanguage ?? currentResult.value.translationLanguage,
      subtitleLanguage: subtitleLanguage ?? currentResult.value.subtitleLanguage,
    };

    // Update preferences
    const result = await this.profileRepository.updatePreferences(userId, newPreferences);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish LanguageChangedEvent
    this.eventBus.publish(
      buildEvent('LanguageChanged', '@aimeetx/sdk/profile', {
        userId,
        language,
        timestamp: new Date().toISOString(),
      }),
    );

    if (translationLanguage !== undefined) {
      this.eventBus.publish(
        buildEvent('TranslationLanguageChanged', '@aimeetx/sdk/profile', {
          userId,
          translationLanguage,
          timestamp: new Date().toISOString(),
        }),
      );
    }

    return success(result.value);
  }
}

// ============================================================================
// UpdateThemeUseCase
// ============================================================================

/**
 * Command for UpdateThemeUseCase.
 */
export interface UpdateThemeCommand {
  readonly userId: UserId;
  readonly theme: Theme;
}

/**
 * UpdateThemeUseCase — changes application theme.
 *
 * Per `feature-profile/SPECIFICATION.md`: changes SHALL be reflected immediately.
 */
@injectable()
export class UpdateThemeUseCase implements UseCase<UpdateThemeCommand, Theme, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateThemeCommand): Promise<Result<Theme, Error>> {
    const { userId, theme } = command;

    if (!validateTheme(theme)) {
      return failure(new Error(`Invalid theme: ${theme}`));
    }

    // Get current preferences
    const currentResult = await this.profileRepository.getPreferences(userId);
    if (currentResult.isFailure) {
      return failure(currentResult.error);
    }

    const newPreferences: UserPreferences = {
      ...currentResult.value,
      theme,
    };

    // Update preferences
    const result = await this.profileRepository.updatePreferences(userId, newPreferences);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish ThemeChangedEvent
    this.eventBus.publish(
      buildEvent('ThemeChanged', '@aimeetx/sdk/profile', {
        userId,
        theme,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(theme);
  }
}

// ============================================================================
// UpdateNotificationSettingsUseCase
// ============================================================================

/**
 * Command for UpdateNotificationSettingsUseCase.
 */
export interface UpdateNotificationSettingsCommand {
  readonly userId: UserId;
  readonly settings: NotificationSettings;
}

/**
 * UpdateNotificationSettingsUseCase — updates notification settings.
 *
 * Per `feature-profile/SPECIFICATION.md`: updates push, meeting, chat, reminder notifications.
 */
@injectable()
export class UpdateNotificationSettingsUseCase
  implements UseCase<UpdateNotificationSettingsCommand, NotificationSettings, Error>
{
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateNotificationSettingsCommand): Promise<Result<NotificationSettings, Error>> {
    const { userId, settings } = command;

    // Update notification settings
    const result = await this.profileRepository.updateNotificationSettings(userId, settings);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish NotificationSettingsUpdatedEvent
    this.eventBus.publish(
      buildEvent('NotificationSettingsUpdated', '@aimeetx/sdk/profile', {
        userId,
        pushEnabled: settings.pushEnabled,
        meetingEnabled: settings.meetingEnabled,
        chatEnabled: settings.chatEnabled,
        reminderEnabled: settings.reminderEnabled,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(result.value);
  }
}

// ============================================================================
// UpdatePrivacySettingsUseCase
// ============================================================================

/**
 * Command for UpdatePrivacySettingsUseCase.
 */
export interface UpdatePrivacySettingsCommand {
  readonly userId: UserId;
  readonly settings: PrivacySettings;
}

/**
 * UpdatePrivacySettingsUseCase — updates privacy settings.
 *
 * Per `feature-profile/SPECIFICATION.md`: updates online visibility, read receipts, activity visibility.
 */
@injectable()
export class UpdatePrivacySettingsUseCase
  implements UseCase<UpdatePrivacySettingsCommand, PrivacySettings, Error>
{
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdatePrivacySettingsCommand): Promise<Result<PrivacySettings, Error>> {
    const { userId, settings } = command;

    // Update privacy settings
    const result = await this.profileRepository.updatePrivacySettings(userId, settings);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish PrivacySettingsUpdatedEvent
    this.eventBus.publish(
      buildEvent('PrivacySettingsUpdated', '@aimeetx/sdk/profile', {
        userId,
        profileVisibility: settings.profileVisibility,
        onlineStatusVisible: settings.onlineStatusVisible,
        readReceiptsEnabled: settings.readReceiptsEnabled,
        activityVisible: settings.activityVisible,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(result.value);
  }
}

// ============================================================================
// UpdateAccessibilitySettingsUseCase
// ============================================================================

/**
 * Command for UpdateAccessibilitySettingsUseCase.
 */
export interface UpdateAccessibilitySettingsCommand {
  readonly userId: UserId;
  readonly settings: AccessibilitySettings;
}

/**
 * UpdateAccessibilitySettingsUseCase — updates accessibility settings.
 *
 * Per `feature-profile/SPECIFICATION.md`: updates font scale, high contrast, reduce animations.
 */
@injectable()
export class UpdateAccessibilitySettingsUseCase
  implements UseCase<UpdateAccessibilitySettingsCommand, AccessibilitySettings, Error>
{
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateAccessibilitySettingsCommand): Promise<Result<AccessibilitySettings, Error>> {
    const { userId, settings } = command;

    // Validate font scale
    if (settings.fontScale < 0.5 || settings.fontScale > 2.0) {
      return failure(new Error('Font scale must be between 0.5 and 2.0'));
    }

    // Update accessibility settings
    const result = await this.profileRepository.updateAccessibilitySettings(userId, settings);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish AccessibilitySettingsUpdatedEvent
    this.eventBus.publish(
      buildEvent('AccessibilitySettingsUpdated', '@aimeetx/sdk/profile', {
        userId,
        fontScale: settings.fontScale,
        highContrast: settings.highContrast,
        reduceAnimations: settings.reduceAnimations,
        screenReaderHints: settings.screenReaderHints,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(result.value);
  }
}

// ============================================================================
// UpdatePresenceUseCase
// ============================================================================

/**
 * Command for UpdatePresenceUseCase.
 */
export interface UpdatePresenceCommand {
  readonly userId: UserId;
  readonly presence: Presence;
}

/**
 * UpdatePresenceUseCase — changes user presence.
 *
 * Per `feature-profile/SPECIFICATION.md`: presence values are Online, Busy, Away, In Meeting, Do Not Disturb.
 */
@injectable()
export class UpdatePresenceUseCase implements UseCase<UpdatePresenceCommand, Presence, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdatePresenceCommand): Promise<Result<Presence, Error>> {
    const { userId, presence } = command;

    // Update presence
    const result = await this.profileRepository.updatePresence(userId, presence);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish PresenceChangedEvent
    this.eventBus.publish(
      buildEvent('PresenceChanged', '@aimeetx/sdk/profile', {
        userId,
        presence,
        timestamp: new Date().toISOString(),
      }),
    );

    return success(result.value);
  }
}

// ============================================================================
// DeactivateAccountUseCase
// ============================================================================

/**
 * Command for DeactivateAccountUseCase.
 */
export interface DeactivateAccountCommand {
  readonly userId: UserId;
}

/**
 * DeactivateAccountUseCase — deactivates the user account.
 *
 * Per `feature-profile/SPECIFICATION.md`: account deactivation.
 */
@injectable()
export class DeactivateAccountUseCase implements UseCase<DeactivateAccountCommand, void, Error> {
  constructor(
    @inject(TOKENS.ProfileRepository)
    private readonly profileRepository: ProfileRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeactivateAccountCommand): Promise<Result<void, Error>> {
    const { userId } = command;

    // Deactivate account
    const result = await this.profileRepository.deactivateAccount(userId);
    if (result.isFailure) {
      return failure(result.error);
    }

    // Publish AccountDeactivatedEvent
    this.eventBus.publish(
      buildEvent('AccountDeactivated', '@aimeetx/sdk/profile', {
        userId,
        deactivatedAt: new Date().toISOString(),
      }),
    );

    return success(undefined);
  }
}