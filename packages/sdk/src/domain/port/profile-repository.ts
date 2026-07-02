import type { Result, UserId } from '@aimeetx/types';

import type {
  AccessibilitySettings,
  NotificationSettings,
  Presence,
  PrivacySettings,
  Theme,
  UserPreferences,
  UserProfile,
} from '../model/profile.js';

/**
 * Avatar upload input.
 *
 * Per `feature-profile/API.md`: avatar upload uses multipart/form-data.
 */
export interface AvatarUpload {
  readonly file: Blob;
  readonly filename: string;
  readonly mimeType: string;
}

/**
 * Avatar upload result.
 */
export interface AvatarUploadResult {
  readonly avatarUrl: string;
}

/**
 * Profile update input.
 *
 * Per `feature-profile/SPECIFICATION.md`: editable fields are display name, avatar, preferred language.
 */
export interface ProfileUpdate {
  readonly displayName?: string;
  readonly preferredLanguage?: string;
  readonly translationLanguage?: string;
  readonly subtitleLanguage?: string;
  readonly theme?: Theme;
}

/**
 * Profile repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., HttpProfileRepository, FirestoreProfileRepository).
 *
 * Per `08_DATABASE_OVERVIEW.md` §3: Repository Pattern — UI SHALL NEVER access storage directly.
 */
export interface ProfileRepository {
  /** Get the current user's profile. */
  getProfile(userId: UserId): Promise<Result<UserProfile, Error>>;

  /** Update editable profile fields. */
  updateProfile(userId: UserId, update: ProfileUpdate): Promise<Result<UserProfile, Error>>;

  /** Upload a new avatar. */
  uploadAvatar(userId: UserId, avatar: AvatarUpload): Promise<Result<AvatarUploadResult, Error>>;

  /** Delete the current avatar. */
  deleteAvatar(userId: UserId): Promise<Result<void, Error>>;

  /** Get user preferences. */
  getPreferences(userId: UserId): Promise<Result<UserPreferences, Error>>;

  /** Update user preferences. */
  updatePreferences(userId: UserId, preferences: UserPreferences): Promise<Result<UserPreferences, Error>>;

  /** Get notification settings. */
  getNotificationSettings(userId: UserId): Promise<Result<NotificationSettings, Error>>;

  /** Update notification settings. */
  updateNotificationSettings(
    userId: UserId,
    settings: NotificationSettings,
  ): Promise<Result<NotificationSettings, Error>>;

  /** Get privacy settings. */
  getPrivacySettings(userId: UserId): Promise<Result<PrivacySettings, Error>>;

  /** Update privacy settings. */
  updatePrivacySettings(
    userId: UserId,
    settings: PrivacySettings,
  ): Promise<Result<PrivacySettings, Error>>;

  /** Get accessibility settings. */
  getAccessibilitySettings(userId: UserId): Promise<Result<AccessibilitySettings, Error>>;

  /** Update accessibility settings. */
  updateAccessibilitySettings(
    userId: UserId,
    settings: AccessibilitySettings,
  ): Promise<Result<AccessibilitySettings, Error>>;

  /** Update user presence. */
  updatePresence(userId: UserId, presence: Presence): Promise<Result<Presence, Error>>;

  /** Deactivate the user account. */
  deactivateAccount(userId: UserId): Promise<Result<void, Error>>;
}