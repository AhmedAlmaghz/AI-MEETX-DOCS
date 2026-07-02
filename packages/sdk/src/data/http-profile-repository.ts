import type { HttpClient } from '@aimeetx/network';
import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  AccessibilitySettings,
  AccountStatus,
  NotificationSettings,
  Presence,
  PrivacySettings,
  Theme,
  UserPreferences,
  UserProfile,
  UserRole,
} from '../domain/model/profile.js';
import type {
  AvatarUpload,
  AvatarUploadResult,
  ProfileRepository,
  ProfileUpdate,
} from '../domain/port/profile-repository.js';

/**
 * HTTP-based implementation of ProfileRepository.
 *
 * Per ADR-004 (Clean Architecture): this is an Adapter in the data layer.
 * It calls the backend REST API for profile operations.
 *
 * Per `feature-profile/API.md`: base path is /api/v1/profile.
 */
export class HttpProfileRepository implements ProfileRepository {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly baseUrl: string,
  ) {}

  async getProfile(userId: import('@aimeetx/types').UserId): Promise<Result<UserProfile, Error>> {
    const result = await this.httpClient.get<UserProfileDto>(
      `${this.baseUrl}/profile/${userId}`,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toProfile(result.value));
  }

  async updateProfile(
    userId: import('@aimeetx/types').UserId,
    update: ProfileUpdate,
  ): Promise<Result<UserProfile, Error>> {
    const result = await this.httpClient.patch<UserProfileDto>(
      `${this.baseUrl}/profile/${userId}`,
      update,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toProfile(result.value));
  }

  async uploadAvatar(
    userId: import('@aimeetx/types').UserId,
    avatar: AvatarUpload,
  ): Promise<Result<AvatarUploadResult, Error>> {
    // Build multipart form data
    const formData = new FormData();
    formData.append('avatar', avatar.file, avatar.filename);

    const result = await this.httpClient.post<AvatarUploadResultDto>(
      `${this.baseUrl}/profile/${userId}/avatar`,
      formData,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success({ avatarUrl: result.value.avatarUrl });
  }

  async deleteAvatar(userId: import('@aimeetx/types').UserId): Promise<Result<void, Error>> {
    const result = await this.httpClient.delete<void>(`${this.baseUrl}/profile/${userId}/avatar`);

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(undefined);
  }

  async getPreferences(
    userId: import('@aimeetx/types').UserId,
  ): Promise<Result<UserPreferences, Error>> {
    const result = await this.httpClient.get<UserPreferencesDto>(
      `${this.baseUrl}/profile/${userId}/preferences`,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toPreferences(result.value));
  }

  async updatePreferences(
    userId: import('@aimeetx/types').UserId,
    preferences: UserPreferences,
  ): Promise<Result<UserPreferences, Error>> {
    const result = await this.httpClient.patch<UserPreferencesDto>(
      `${this.baseUrl}/profile/${userId}/preferences`,
      preferences,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toPreferences(result.value));
  }

  async getNotificationSettings(
    userId: import('@aimeetx/types').UserId,
  ): Promise<Result<NotificationSettings, Error>> {
    const result = await this.httpClient.get<NotificationSettingsDto>(
      `${this.baseUrl}/profile/${userId}/preferences/notifications`,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toNotificationSettings(result.value));
  }

  async updateNotificationSettings(
    userId: import('@aimeetx/types').UserId,
    settings: NotificationSettings,
  ): Promise<Result<NotificationSettings, Error>> {
    const result = await this.httpClient.patch<NotificationSettingsDto>(
      `${this.baseUrl}/profile/${userId}/preferences/notifications`,
      settings,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toNotificationSettings(result.value));
  }

  async getPrivacySettings(
    userId: import('@aimeetx/types').UserId,
  ): Promise<Result<PrivacySettings, Error>> {
    const result = await this.httpClient.get<PrivacySettingsDto>(
      `${this.baseUrl}/profile/${userId}/preferences/privacy`,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toPrivacySettings(result.value));
  }

  async updatePrivacySettings(
    userId: import('@aimeetx/types').UserId,
    settings: PrivacySettings,
  ): Promise<Result<PrivacySettings, Error>> {
    const result = await this.httpClient.patch<PrivacySettingsDto>(
      `${this.baseUrl}/profile/${userId}/preferences/privacy`,
      settings,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toPrivacySettings(result.value));
  }

  async getAccessibilitySettings(
    userId: import('@aimeetx/types').UserId,
  ): Promise<Result<AccessibilitySettings, Error>> {
    const result = await this.httpClient.get<AccessibilitySettingsDto>(
      `${this.baseUrl}/profile/${userId}/preferences/accessibility`,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toAccessibilitySettings(result.value));
  }

  async updateAccessibilitySettings(
    userId: import('@aimeetx/types').UserId,
    settings: AccessibilitySettings,
  ): Promise<Result<AccessibilitySettings, Error>> {
    const result = await this.httpClient.patch<AccessibilitySettingsDto>(
      `${this.baseUrl}/profile/${userId}/preferences/accessibility`,
      settings,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(this.toAccessibilitySettings(result.value));
  }

  async updatePresence(
    userId: import('@aimeetx/types').UserId,
    presence: Presence,
  ): Promise<Result<Presence, Error>> {
    const result = await this.httpClient.put<{ status: Presence }>(
      `${this.baseUrl}/profile/${userId}/presence`,
      { status: presence },
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(result.value.status);
  }

  async deactivateAccount(
    userId: import('@aimeetx/types').UserId,
  ): Promise<Result<void, Error>> {
    const result = await this.httpClient.post<void>(
      `${this.baseUrl}/profile/${userId}/deactivate`,
    );

    if (result.isFailure) {
      return failure(new Error(result.error.message));
    }

    return success(undefined);
  }

  // ============================================================================
  // Mappers
  // ============================================================================

  private toProfile(dto: UserProfileDto): UserProfile {
    return {
      userId: dto.userId as import('@aimeetx/types').UserId,
      displayName: dto.displayName,
      email: dto.email,
      avatarUrl: dto.avatarUrl,
      preferredLanguage: dto.preferredLanguage,
      translationLanguage: dto.translationLanguage,
      subtitleLanguage: dto.subtitleLanguage,
      theme: dto.theme,
      role: dto.role,
      status: dto.status,
      presence: dto.presence,
      preferences: this.toPreferences(dto.preferences),
      notifications: this.toNotificationSettings(dto.notifications),
      privacy: this.toPrivacySettings(dto.privacy),
      accessibility: this.toAccessibilitySettings(dto.accessibility),
      createdAt: dto.createdAt as import('@aimeetx/types').IsoDateString,
      updatedAt: dto.updatedAt as import('@aimeetx/types').IsoDateString,
    };
  }

  private toPreferences(dto: UserPreferencesDto): UserPreferences {
    return {
      theme: dto.theme,
      language: dto.language,
      translationLanguage: dto.translationLanguage,
      subtitleLanguage: dto.subtitleLanguage,
    };
  }

  private toNotificationSettings(dto: NotificationSettingsDto): NotificationSettings {
    return {
      pushEnabled: dto.pushEnabled,
      meetingEnabled: dto.meetingEnabled,
      chatEnabled: dto.chatEnabled,
      reminderEnabled: dto.reminderEnabled,
    };
  }

  private toPrivacySettings(dto: PrivacySettingsDto): PrivacySettings {
    return {
      profileVisibility: dto.profileVisibility,
      onlineStatusVisible: dto.onlineStatusVisible,
      readReceiptsEnabled: dto.readReceiptsEnabled,
      activityVisible: dto.activityVisible,
    };
  }

  private toAccessibilitySettings(dto: AccessibilitySettingsDto): AccessibilitySettings {
    return {
      fontScale: dto.fontScale,
      highContrast: dto.highContrast,
      reduceAnimations: dto.reduceAnimations,
      screenReaderHints: dto.screenReaderHints,
    };
  }
}

// ============================================================================
// DTOs
// ============================================================================

interface UserProfileDto {
  readonly userId: string;
  readonly displayName: string;
  readonly email: string;
  readonly avatarUrl: string | null;
  readonly preferredLanguage: string;
  readonly translationLanguage: string;
  readonly subtitleLanguage: string;
  readonly theme: Theme;
  readonly role: UserRole;
  readonly status: AccountStatus;
  readonly presence: Presence;
  readonly preferences: UserPreferencesDto;
  readonly notifications: NotificationSettingsDto;
  readonly privacy: PrivacySettingsDto;
  readonly accessibility: AccessibilitySettingsDto;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface UserPreferencesDto {
  readonly theme: Theme;
  readonly language: string;
  readonly translationLanguage: string;
  readonly subtitleLanguage: string;
}

interface NotificationSettingsDto {
  readonly pushEnabled: boolean;
  readonly meetingEnabled: boolean;
  readonly chatEnabled: boolean;
  readonly reminderEnabled: boolean;
}

interface PrivacySettingsDto {
  readonly profileVisibility: 'public' | 'private' | 'contacts_only';
  readonly onlineStatusVisible: boolean;
  readonly readReceiptsEnabled: boolean;
  readonly activityVisible: boolean;
}

interface AccessibilitySettingsDto {
  readonly fontScale: number;
  readonly highContrast: boolean;
  readonly reduceAnimations: boolean;
  readonly screenReaderHints: boolean;
}

interface AvatarUploadResultDto {
  readonly avatarUrl: string;
}