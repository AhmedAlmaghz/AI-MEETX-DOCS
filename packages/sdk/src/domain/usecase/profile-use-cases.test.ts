import 'reflect-metadata';

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';

import type { IsoDateString, UserId } from '@aimeetx/types';

import { InMemoryEventBus } from '@aimeetx/events';

import type {
  AccessibilitySettings,
  NotificationSettings,
  Presence,
  PrivacySettings,
  Theme,
  UserPreferences,
  UserProfile,
} from '../model/profile.js';
import type {
  AvatarUpload,
  AvatarUploadResult,
  ProfileRepository,
  ProfileUpdate,
} from '../port/profile-repository.js';
import {
  DeactivateAccountUseCase,
  DeleteAvatarUseCase,
  GetProfileUseCase,
  UpdateAccessibilitySettingsUseCase,
  UpdateLanguagePreferenceUseCase,
  UpdateNotificationSettingsUseCase,
  UpdatePresenceUseCase,
  UpdatePrivacySettingsUseCase,
  UpdateProfileUseCase,
  UpdateThemeUseCase,
  UploadAvatarUseCase,
} from './profile-use-cases.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const makeUserId = (): UserId => 'user_123' as UserId;

const makePreferences = (overrides: Partial<UserPreferences> = {}): UserPreferences => ({
  theme: 'system',
  language: 'en',
  translationLanguage: 'en',
  subtitleLanguage: 'en',
  ...overrides,
});

const makeNotifications = (
  overrides: Partial<NotificationSettings> = {},
): NotificationSettings => ({
  pushEnabled: true,
  meetingEnabled: true,
  chatEnabled: true,
  reminderEnabled: true,
  ...overrides,
});

const makePrivacy = (overrides: Partial<PrivacySettings> = {}): PrivacySettings => ({
  profileVisibility: 'public',
  onlineStatusVisible: true,
  readReceiptsEnabled: true,
  activityVisible: true,
  ...overrides,
});

const makeAccessibility = (
  overrides: Partial<AccessibilitySettings> = {},
): AccessibilitySettings => ({
  fontScale: 1.0,
  highContrast: false,
  reduceAnimations: false,
  screenReaderHints: false,
  ...overrides,
});

const makeProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  userId: makeUserId(),
  displayName: 'Test User',
  email: 'test@example.com',
  avatarUrl: null,
  preferredLanguage: 'en',
  translationLanguage: 'en',
  subtitleLanguage: 'en',
  theme: 'system',
  role: 'member',
  status: 'active',
  presence: 'online',
  preferences: makePreferences(),
  notifications: makeNotifications(),
  privacy: makePrivacy(),
  accessibility: makeAccessibility(),
  createdAt: '2026-02-07T00:00:00.000Z' as IsoDateString,
  updatedAt: '2026-02-07T00:00:00.000Z' as IsoDateString,
  ...overrides,
});

const makeAvatarUpload = (overrides: Partial<AvatarUpload> = {}): AvatarUpload => {
  const file = new Blob(['fake-image-data'], { type: 'image/png' });
  Object.defineProperty(file, 'size', { value: 1024, configurable: true });
  return {
    file,
    filename: 'avatar.png',
    mimeType: 'image/png',
    ...overrides,
  };
};

// ============================================================================
// Tests
// ============================================================================

describe('Profile Use Cases', () => {
  let mockProfileRepo: ProfileRepository;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    container.reset();
    eventBus = new InMemoryEventBus();
    container.registerInstance(TOKENS.EventBus, eventBus);

    mockProfileRepo = {
      getProfile: vi.fn(),
      updateProfile: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
      getPreferences: vi.fn(),
      updatePreferences: vi.fn(),
      getNotificationSettings: vi.fn(),
      updateNotificationSettings: vi.fn(),
      getPrivacySettings: vi.fn(),
      updatePrivacySettings: vi.fn(),
      getAccessibilitySettings: vi.fn(),
      updateAccessibilitySettings: vi.fn(),
      updatePresence: vi.fn(),
      deactivateAccount: vi.fn(),
    };

    container.registerInstance(TOKENS.ProfileRepository, mockProfileRepo);
  });

  // ==========================================================================
  // GetProfileUseCase
  // ==========================================================================

  describe('GetProfileUseCase', () => {
    it('returns the profile from the repository', async () => {
      const profile = makeProfile();
      vi.mocked(mockProfileRepo.getProfile).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: profile,
      });

      container.register(TOKENS.GetProfileUseCase, { useClass: GetProfileUseCase });
      const useCase = container.resolve<GetProfileUseCase>(TOKENS.GetProfileUseCase);

      const result = await useCase.execute({ userId: makeUserId() });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.displayName).toBe('Test User');
      }
    });

    it('returns failure when repository fails', async () => {
      vi.mocked(mockProfileRepo.getProfile).mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: new Error('Profile not found'),
      });

      container.register(TOKENS.GetProfileUseCase, { useClass: GetProfileUseCase });
      const useCase = container.resolve<GetProfileUseCase>(TOKENS.GetProfileUseCase);

      const result = await useCase.execute({ userId: makeUserId() });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toBe('Profile not found');
      }
    });
  });

  // ==========================================================================
  // UpdateProfileUseCase
  // ==========================================================================

  describe('UpdateProfileUseCase', () => {
    it('returns failure when display name is too short', async () => {
      container.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
      const useCase = container.resolve<UpdateProfileUseCase>(TOKENS.UpdateProfileUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        update: { displayName: 'ab' },
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('at least');
      }
    });

    it('returns failure when display name is too long', async () => {
      container.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
      const useCase = container.resolve<UpdateProfileUseCase>(TOKENS.UpdateProfileUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        update: { displayName: 'a'.repeat(51) },
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('at most');
      }
    });

    it('returns failure when language is invalid', async () => {
      container.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
      const useCase = container.resolve<UpdateProfileUseCase>(TOKENS.UpdateProfileUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        update: { preferredLanguage: 'invalid' },
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('Invalid preferred language');
      }
    });

    it('returns failure when theme is invalid', async () => {
      container.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
      const useCase = container.resolve<UpdateProfileUseCase>(TOKENS.UpdateProfileUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        update: { theme: 'invalid' as unknown as Theme },
      });

      expect(result.isFailure).toBe(true);
    });

    it('updates profile and publishes events on success', async () => {
      const profile = makeProfile({ displayName: 'Updated Name' });
      vi.mocked(mockProfileRepo.updateProfile).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: profile,
      });

      const events: string[] = [];
      eventBus.on('ProfileUpdated').subscribe(() => events.push('ProfileUpdated'));
      eventBus.on('LanguageChanged').subscribe(() => events.push('LanguageChanged'));
      eventBus.on('ThemeChanged').subscribe(() => events.push('ThemeChanged'));

      container.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
      const useCase = container.resolve<UpdateProfileUseCase>(TOKENS.UpdateProfileUseCase);

      const update: ProfileUpdate = {
        displayName: 'Updated Name',
        preferredLanguage: 'ar',
        theme: 'dark',
      };

      const result = await useCase.execute({ userId: makeUserId(), update });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('ProfileUpdated');
      expect(events).toContain('LanguageChanged');
      expect(events).toContain('ThemeChanged');
    });
  });

  // ==========================================================================
  // UploadAvatarUseCase
  // ==========================================================================

  describe('UploadAvatarUseCase', () => {
    it('returns failure when file is too large', async () => {
      const largeFile = new Blob(['x'], { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024, configurable: true });

      container.register(TOKENS.UploadAvatarUseCase, { useClass: UploadAvatarUseCase });
      const useCase = container.resolve<UploadAvatarUseCase>(TOKENS.UploadAvatarUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        avatar: makeAvatarUpload({ file: largeFile }),
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('too large');
      }
    });

    it('returns failure when format is unsupported', async () => {
      container.register(TOKENS.UploadAvatarUseCase, { useClass: UploadAvatarUseCase });
      const useCase = container.resolve<UploadAvatarUseCase>(TOKENS.UploadAvatarUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        avatar: makeAvatarUpload({ mimeType: 'image/gif' }),
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('Unsupported');
      }
    });

    it('uploads avatar and publishes event on success', async () => {
      const uploadResult: AvatarUploadResult = { avatarUrl: 'https://cdn.example.com/avatar.png' };
      vi.mocked(mockProfileRepo.uploadAvatar).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: uploadResult,
      });

      const events: string[] = [];
      eventBus.on('AvatarUpdated').subscribe(() => events.push('AvatarUpdated'));

      container.register(TOKENS.UploadAvatarUseCase, { useClass: UploadAvatarUseCase });
      const useCase = container.resolve<UploadAvatarUseCase>(TOKENS.UploadAvatarUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        avatar: makeAvatarUpload(),
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe('https://cdn.example.com/avatar.png');
      }
      expect(events).toContain('AvatarUpdated');
    });
  });

  // ==========================================================================
  // DeleteAvatarUseCase
  // ==========================================================================

  describe('DeleteAvatarUseCase', () => {
    it('deletes avatar and publishes event on success', async () => {
      vi.mocked(mockProfileRepo.deleteAvatar).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const events: string[] = [];
      eventBus.on('AvatarRemoved').subscribe(() => events.push('AvatarRemoved'));

      container.register(TOKENS.DeleteAvatarUseCase, { useClass: DeleteAvatarUseCase });
      const useCase = container.resolve<DeleteAvatarUseCase>(TOKENS.DeleteAvatarUseCase);

      const result = await useCase.execute({ userId: makeUserId() });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('AvatarRemoved');
    });
  });

  // ==========================================================================
  // UpdateLanguagePreferenceUseCase
  // ==========================================================================

  describe('UpdateLanguagePreferenceUseCase', () => {
    it('returns failure when language is invalid', async () => {
      container.register(TOKENS.UpdateLanguagePreferenceUseCase, {
        useClass: UpdateLanguagePreferenceUseCase,
      });
      const useCase = container.resolve<UpdateLanguagePreferenceUseCase>(
        TOKENS.UpdateLanguagePreferenceUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        language: 'invalid',
      });

      expect(result.isFailure).toBe(true);
    });

    it('updates language and publishes event on success', async () => {
      const currentPrefs = makePreferences();
      const newPrefs = makePreferences({ language: 'ar' });

      vi.mocked(mockProfileRepo.getPreferences).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: currentPrefs,
      });
      vi.mocked(mockProfileRepo.updatePreferences).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: newPrefs,
      });

      const events: string[] = [];
      eventBus.on('LanguageChanged').subscribe(() => events.push('LanguageChanged'));

      container.register(TOKENS.UpdateLanguagePreferenceUseCase, {
        useClass: UpdateLanguagePreferenceUseCase,
      });
      const useCase = container.resolve<UpdateLanguagePreferenceUseCase>(
        TOKENS.UpdateLanguagePreferenceUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        language: 'ar',
      });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('LanguageChanged');
    });
  });

  // ==========================================================================
  // UpdateThemeUseCase
  // ==========================================================================

  describe('UpdateThemeUseCase', () => {
    it('returns failure when theme is invalid', async () => {
      container.register(TOKENS.UpdateThemeUseCase, { useClass: UpdateThemeUseCase });
      const useCase = container.resolve<UpdateThemeUseCase>(TOKENS.UpdateThemeUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        theme: 'invalid' as unknown as Theme,
      });

      expect(result.isFailure).toBe(true);
    });

    it('updates theme and publishes event on success', async () => {
      const currentPrefs = makePreferences({ theme: 'light' });
      const newPrefs = makePreferences({ theme: 'dark' });

      vi.mocked(mockProfileRepo.getPreferences).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: currentPrefs,
      });
      vi.mocked(mockProfileRepo.updatePreferences).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: newPrefs,
      });

      const events: string[] = [];
      eventBus.on('ThemeChanged').subscribe(() => events.push('ThemeChanged'));

      container.register(TOKENS.UpdateThemeUseCase, { useClass: UpdateThemeUseCase });
      const useCase = container.resolve<UpdateThemeUseCase>(TOKENS.UpdateThemeUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        theme: 'dark',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe('dark');
      }
      expect(events).toContain('ThemeChanged');
    });
  });

  // ==========================================================================
  // UpdateNotificationSettingsUseCase
  // ==========================================================================

  describe('UpdateNotificationSettingsUseCase', () => {
    it('updates notification settings and publishes event on success', async () => {
      const settings = makeNotifications({ pushEnabled: false });
      vi.mocked(mockProfileRepo.updateNotificationSettings).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: settings,
      });

      const events: string[] = [];
      eventBus.on('NotificationSettingsUpdated').subscribe(() =>
        events.push('NotificationSettingsUpdated'),
      );

      container.register(TOKENS.UpdateNotificationSettingsUseCase, {
        useClass: UpdateNotificationSettingsUseCase,
      });
      const useCase = container.resolve<UpdateNotificationSettingsUseCase>(
        TOKENS.UpdateNotificationSettingsUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        settings,
      });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('NotificationSettingsUpdated');
    });
  });

  // ==========================================================================
  // UpdatePrivacySettingsUseCase
  // ==========================================================================

  describe('UpdatePrivacySettingsUseCase', () => {
    it('updates privacy settings and publishes event on success', async () => {
      const settings = makePrivacy({ profileVisibility: 'private' });
      vi.mocked(mockProfileRepo.updatePrivacySettings).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: settings,
      });

      const events: string[] = [];
      eventBus.on('PrivacySettingsUpdated').subscribe(() => events.push('PrivacySettingsUpdated'));

      container.register(TOKENS.UpdatePrivacySettingsUseCase, {
        useClass: UpdatePrivacySettingsUseCase,
      });
      const useCase = container.resolve<UpdatePrivacySettingsUseCase>(
        TOKENS.UpdatePrivacySettingsUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        settings,
      });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('PrivacySettingsUpdated');
    });
  });

  // ==========================================================================
  // UpdateAccessibilitySettingsUseCase
  // ==========================================================================

  describe('UpdateAccessibilitySettingsUseCase', () => {
    it('returns failure when font scale is too small', async () => {
      container.register(TOKENS.UpdateAccessibilitySettingsUseCase, {
        useClass: UpdateAccessibilitySettingsUseCase,
      });
      const useCase = container.resolve<UpdateAccessibilitySettingsUseCase>(
        TOKENS.UpdateAccessibilitySettingsUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        settings: makeAccessibility({ fontScale: 0.1 }),
      });

      expect(result.isFailure).toBe(true);
    });

    it('returns failure when font scale is too large', async () => {
      container.register(TOKENS.UpdateAccessibilitySettingsUseCase, {
        useClass: UpdateAccessibilitySettingsUseCase,
      });
      const useCase = container.resolve<UpdateAccessibilitySettingsUseCase>(
        TOKENS.UpdateAccessibilitySettingsUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        settings: makeAccessibility({ fontScale: 3.0 }),
      });

      expect(result.isFailure).toBe(true);
    });

    it('updates accessibility settings and publishes event on success', async () => {
      const settings = makeAccessibility({ fontScale: 1.5, highContrast: true });
      vi.mocked(mockProfileRepo.updateAccessibilitySettings).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: settings,
      });

      const events: string[] = [];
      eventBus.on('AccessibilitySettingsUpdated').subscribe(() =>
        events.push('AccessibilitySettingsUpdated'),
      );

      container.register(TOKENS.UpdateAccessibilitySettingsUseCase, {
        useClass: UpdateAccessibilitySettingsUseCase,
      });
      const useCase = container.resolve<UpdateAccessibilitySettingsUseCase>(
        TOKENS.UpdateAccessibilitySettingsUseCase,
      );

      const result = await useCase.execute({
        userId: makeUserId(),
        settings,
      });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('AccessibilitySettingsUpdated');
    });
  });

  // ==========================================================================
  // UpdatePresenceUseCase
  // ==========================================================================

  describe('UpdatePresenceUseCase', () => {
    it('updates presence and publishes event on success', async () => {
      const presence: Presence = 'do_not_disturb';
      vi.mocked(mockProfileRepo.updatePresence).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: presence,
      });

      const events: string[] = [];
      eventBus.on('PresenceChanged').subscribe(() => events.push('PresenceChanged'));

      container.register(TOKENS.UpdatePresenceUseCase, { useClass: UpdatePresenceUseCase });
      const useCase = container.resolve<UpdatePresenceUseCase>(TOKENS.UpdatePresenceUseCase);

      const result = await useCase.execute({
        userId: makeUserId(),
        presence,
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe('do_not_disturb');
      }
      expect(events).toContain('PresenceChanged');
    });
  });

  // ==========================================================================
  // DeactivateAccountUseCase
  // ==========================================================================

  describe('DeactivateAccountUseCase', () => {
    it('deactivates account and publishes event on success', async () => {
      vi.mocked(mockProfileRepo.deactivateAccount).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: undefined,
      });

      const events: string[] = [];
      eventBus.on('AccountDeactivated').subscribe(() => events.push('AccountDeactivated'));

      container.register(TOKENS.DeactivateAccountUseCase, { useClass: DeactivateAccountUseCase });
      const useCase = container.resolve<DeactivateAccountUseCase>(TOKENS.DeactivateAccountUseCase);

      const result = await useCase.execute({ userId: makeUserId() });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('AccountDeactivated');
    });

    it('returns failure when repository fails', async () => {
      vi.mocked(mockProfileRepo.deactivateAccount).mockResolvedValue({
        isSuccess: false,
        isFailure: true,
        error: new Error('Server error'),
      });

      container.register(TOKENS.DeactivateAccountUseCase, { useClass: DeactivateAccountUseCase });
      const useCase = container.resolve<DeactivateAccountUseCase>(TOKENS.DeactivateAccountUseCase);

      const result = await useCase.execute({ userId: makeUserId() });

      expect(result.isFailure).toBe(true);
    });
  });
});