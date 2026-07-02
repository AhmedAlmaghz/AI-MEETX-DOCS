import type { IsoDateString, UserId } from '@aimeetx/types';

/**
 * Theme preference.
 *
 * Per `feature-profile/SPECIFICATION.md`: supported themes are Light, Dark, System.
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * User role.
 *
 * Per `feature-profile/DATABASE.md`: roles are owner, admin, moderator, teacher, presenter, member, guest.
 */
export type UserRole =
  | 'owner'
  | 'admin'
  | 'moderator'
  | 'teacher'
  | 'presenter'
  | 'member'
  | 'guest';

/**
 * Account status.
 *
 * Per `feature-profile/SPECIFICATION.md`: account status values.
 */
export type AccountStatus = 'active' | 'inactive' | 'suspended' | 'deactivated';

/**
 * User presence.
 *
 * Per `feature-profile/SPECIFICATION.md`: presence values.
 */
export type Presence = 'online' | 'away' | 'busy' | 'in_meeting' | 'do_not_disturb';

/**
 * Profile visibility.
 *
 * Per `feature-profile/DATABASE.md`: profile visibility options.
 */
export type ProfileVisibility = 'public' | 'private' | 'contacts_only';

/**
 * User profile aggregate root.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 *
 * Per `feature-profile/DATABASE.md`: Profile is the root entity with owned objects
 * (UserPreferences, NotificationSettings, PrivacySettings, AccessibilitySettings, Presence).
 */
export interface UserProfile {
  readonly userId: UserId;
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
  readonly preferences: UserPreferences;
  readonly notifications: NotificationSettings;
  readonly privacy: PrivacySettings;
  readonly accessibility: AccessibilitySettings;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * User preferences.
 *
 * Per `feature-profile/DATABASE.md`: UserPreferences owned object.
 */
export interface UserPreferences {
  readonly theme: Theme;
  readonly language: string;
  readonly translationLanguage: string;
  readonly subtitleLanguage: string;
}

/**
 * Notification settings.
 *
 * Per `feature-profile/DATABASE.md`: NotificationSettings owned object.
 */
export interface NotificationSettings {
  readonly pushEnabled: boolean;
  readonly meetingEnabled: boolean;
  readonly chatEnabled: boolean;
  readonly reminderEnabled: boolean;
}

/**
 * Privacy settings.
 *
 * Per `feature-profile/DATABASE.md`: PrivacySettings owned object.
 */
export interface PrivacySettings {
  readonly profileVisibility: ProfileVisibility;
  readonly onlineStatusVisible: boolean;
  readonly readReceiptsEnabled: boolean;
  readonly activityVisible: boolean;
}

/**
 * Accessibility settings.
 *
 * Per `feature-profile/DATABASE.md`: AccessibilitySettings owned object.
 */
export interface AccessibilitySettings {
  readonly fontScale: number;
  readonly highContrast: boolean;
  readonly reduceAnimations: boolean;
  readonly screenReaderHints: boolean;
}

/**
 * Avatar upload constraints.
 *
 * Per `feature-profile/SPECIFICATION.md`: max 10MB, PNG/JPEG/WEBP.
 */
export const AVATAR_CONSTRAINTS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
  SUPPORTED_FORMATS: ['image/png', 'image/jpeg', 'image/webp'] as const,
  MAX_DISPLAY_NAME_LENGTH: 50,
  MIN_DISPLAY_NAME_LENGTH: 3,
} as const;

/**
 * Profile error types.
 *
 * Per `feature-profile/API.md`: error codes.
 */
export type ProfileError =
  | { readonly code: 'ProfileNotFound'; readonly message: string }
  | { readonly code: 'InvalidProfile'; readonly message: string }
  | { readonly code: 'InvalidAvatar'; readonly message: string }
  | { readonly code: 'FileTooLarge'; readonly message: string; readonly maxBytes: number }
  | { readonly code: 'UnsupportedFormat'; readonly message: string; readonly format: string }
  | { readonly code: 'InvalidLanguage'; readonly message: string; readonly language: string }
  | { readonly code: 'InvalidTheme'; readonly message: string; readonly theme: string }
  | { readonly code: 'InvalidDisplayName'; readonly message: string }
  | { readonly code: 'Unauthorized'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'ServerError'; readonly message: string; readonly status?: number }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };