import type { DomainEvent, IsoDateString, Uuid } from '@aimeetx/types';

import type { Presence, Theme } from '../model/profile.js';

/**
 * ProfileUpdatedEvent — published when profile information is updated.
 *
 * Per `feature-profile/EVENTS.md`: triggered after profile information is successfully updated.
 */
export interface ProfileUpdatedEvent extends DomainEvent {
  readonly eventType: 'ProfileUpdated';
  readonly payload: {
    readonly userId: Uuid;
    readonly updatedFields: ReadonlyArray<string>;
    readonly timestamp: IsoDateString;
  };
}

/**
 * AvatarUpdatedEvent — published when avatar is uploaded.
 *
 * Per `feature-profile/EVENTS.md`: triggered after avatar upload succeeds.
 */
export interface AvatarUpdatedEvent extends DomainEvent {
  readonly eventType: 'AvatarUpdated';
  readonly payload: {
    readonly userId: Uuid;
    readonly avatarUrl: string;
    readonly timestamp: IsoDateString;
  };
}

/**
 * AvatarRemovedEvent — published when avatar is deleted.
 *
 * Per `feature-profile/EVENTS.md`: triggered after avatar deletion.
 */
export interface AvatarRemovedEvent extends DomainEvent {
  readonly eventType: 'AvatarRemoved';
  readonly payload: {
    readonly userId: Uuid;
    readonly timestamp: IsoDateString;
  };
}

/**
 * ThemeChangedEvent — published when application theme changes.
 *
 * Per `feature-profile/EVENTS.md`: triggered when application theme changes.
 */
export interface ThemeChangedEvent extends DomainEvent {
  readonly eventType: 'ThemeChanged';
  readonly payload: {
    readonly userId: Uuid;
    readonly theme: Theme;
    readonly timestamp: IsoDateString;
  };
}

/**
 * LanguageChangedEvent — published when UI language changes.
 *
 * Per `feature-profile/EVENTS.md`: triggered when UI language changes.
 */
export interface LanguageChangedEvent extends DomainEvent {
  readonly eventType: 'LanguageChanged';
  readonly payload: {
    readonly userId: Uuid;
    readonly language: string;
    readonly timestamp: IsoDateString;
  };
}

/**
 * TranslationLanguageChangedEvent — published when preferred translation language changes.
 *
 * Per `feature-profile/EVENTS.md`: triggered when preferred translation language changes.
 */
export interface TranslationLanguageChangedEvent extends DomainEvent {
  readonly eventType: 'TranslationLanguageChanged';
  readonly payload: {
    readonly userId: Uuid;
    readonly translationLanguage: string;
    readonly timestamp: IsoDateString;
  };
}

/**
 * NotificationSettingsUpdatedEvent — published when notification settings change.
 *
 * Per `feature-profile/EVENTS.md`: triggered when notification settings are updated.
 */
export interface NotificationSettingsUpdatedEvent extends DomainEvent {
  readonly eventType: 'NotificationSettingsUpdated';
  readonly payload: {
    readonly userId: Uuid;
    readonly pushEnabled: boolean;
    readonly meetingEnabled: boolean;
    readonly chatEnabled: boolean;
    readonly reminderEnabled: boolean;
    readonly timestamp: IsoDateString;
  };
}

/**
 * PrivacySettingsUpdatedEvent — published when privacy settings change.
 *
 * Per `feature-profile/EVENTS.md`: triggered when privacy settings are updated.
 */
export interface PrivacySettingsUpdatedEvent extends DomainEvent {
  readonly eventType: 'PrivacySettingsUpdated';
  readonly payload: {
    readonly userId: Uuid;
    readonly profileVisibility: string;
    readonly onlineStatusVisible: boolean;
    readonly readReceiptsEnabled: boolean;
    readonly activityVisible: boolean;
    readonly timestamp: IsoDateString;
  };
}

/**
 * AccessibilitySettingsUpdatedEvent — published when accessibility settings change.
 *
 * Per `feature-profile/EVENTS.md`: triggered when accessibility settings are updated.
 */
export interface AccessibilitySettingsUpdatedEvent extends DomainEvent {
  readonly eventType: 'AccessibilitySettingsUpdated';
  readonly payload: {
    readonly userId: Uuid;
    readonly fontScale: number;
    readonly highContrast: boolean;
    readonly reduceAnimations: boolean;
    readonly screenReaderHints: boolean;
    readonly timestamp: IsoDateString;
  };
}

/**
 * PresenceChangedEvent — published when user presence changes.
 *
 * Per `feature-profile/EVENTS.md`: triggered when user presence changes.
 */
export interface PresenceChangedEvent extends DomainEvent {
  readonly eventType: 'PresenceChanged';
  readonly payload: {
    readonly userId: Uuid;
    readonly presence: Presence;
    readonly timestamp: IsoDateString;
  };
}

/**
 * AccountDeactivatedEvent — published when user deactivates their account.
 */
export interface AccountDeactivatedEvent extends DomainEvent {
  readonly eventType: 'AccountDeactivated';
  readonly payload: {
    readonly userId: Uuid;
    readonly deactivatedAt: IsoDateString;
  };
}

/**
 * Union of all profile-related domain events.
 */
export type ProfileEvent =
  | ProfileUpdatedEvent
  | AvatarUpdatedEvent
  | AvatarRemovedEvent
  | ThemeChangedEvent
  | LanguageChangedEvent
  | TranslationLanguageChangedEvent
  | NotificationSettingsUpdatedEvent
  | PrivacySettingsUpdatedEvent
  | AccessibilitySettingsUpdatedEvent
  | PresenceChangedEvent
  | AccountDeactivatedEvent;