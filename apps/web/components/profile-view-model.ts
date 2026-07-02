'use client';

import { useCallback, useEffect, useState } from 'react';

import type { UserId } from '@aimeetx/types';

import {
  DeactivateAccountUseCase,
  DeleteAvatarUseCase,
  GetProfileUseCase,
  HttpProfileRepository,
  UpdateAccessibilitySettingsUseCase,
  UpdateLanguagePreferenceUseCase,
  UpdateNotificationSettingsUseCase,
  UpdatePresenceUseCase,
  UpdatePrivacySettingsUseCase,
  UpdateProfileUseCase,
  UpdateThemeUseCase,
  UploadAvatarUseCase,
  initializeSdk,
  sdkContainer,
  TOKENS,
  type AccessibilitySettings,
  type NotificationSettings,
  type Presence,
  type PrivacySettings,
  type Theme,
  type UserProfile,
} from '@aimeetx/sdk';

/**
 * Profile state model.
 *
 * Per `feature-profile/SPECIFICATION.md`: ProfileState has Loading, Loaded, Updating, Error.
 */
export type ProfileState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly profile: UserProfile }
  | { readonly status: 'updating'; readonly profile: UserProfile }
  | { readonly status: 'error'; readonly error: string };

/**
 * Initialize the profile SDK bindings.
 *
 * Per ADR-005: this is a client-side helper that wires up the SDK for the profile feature.
 */
function initializeProfileSdk(): void {
  initializeSdk({ apiBaseUrl: 'https://api.aimeetx.com' });

  const httpClient = sdkContainer.resolve<import('@aimeetx/network').HttpClient>(TOKENS.HttpClient);
  sdkContainer.registerInstance(
    TOKENS.ProfileRepository,
    new HttpProfileRepository(httpClient, 'https://api.aimeetx.com'),
  );

  sdkContainer.register(TOKENS.GetProfileUseCase, { useClass: GetProfileUseCase });
  sdkContainer.register(TOKENS.UpdateProfileUseCase, { useClass: UpdateProfileUseCase });
  sdkContainer.register(TOKENS.UploadAvatarUseCase, { useClass: UploadAvatarUseCase });
  sdkContainer.register(TOKENS.DeleteAvatarUseCase, { useClass: DeleteAvatarUseCase });
  sdkContainer.register(TOKENS.UpdateLanguagePreferenceUseCase, {
    useClass: UpdateLanguagePreferenceUseCase,
  });
  sdkContainer.register(TOKENS.UpdateThemeUseCase, { useClass: UpdateThemeUseCase });
  sdkContainer.register(TOKENS.UpdateNotificationSettingsUseCase, {
    useClass: UpdateNotificationSettingsUseCase,
  });
  sdkContainer.register(TOKENS.UpdatePrivacySettingsUseCase, {
    useClass: UpdatePrivacySettingsUseCase,
  });
  sdkContainer.register(TOKENS.UpdateAccessibilitySettingsUseCase, {
    useClass: UpdateAccessibilitySettingsUseCase,
  });
  sdkContainer.register(TOKENS.UpdatePresenceUseCase, { useClass: UpdatePresenceUseCase });
  sdkContainer.register(TOKENS.DeactivateAccountUseCase, { useClass: DeactivateAccountUseCase });
}

/**
 * ProfileViewModel — React hook for managing profile state.
 *
 * Per `feature-profile/SPECIFICATION.md`: ProfileViewModel with StateFlow state management.
 * This is the React equivalent of a StateFlow-based ViewModel.
 */
export function useProfileViewModel(userId: UserId) {
  const [state, setState] = useState<ProfileState>({ status: 'idle' });

  // Initialize SDK bindings once
  useEffect(() => {
    try {
      initializeProfileSdk();
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to initialize SDK',
      });
    }
  }, []);

  // Load profile
  const loadProfile = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const useCase = sdkContainer.resolve<GetProfileUseCase>(TOKENS.GetProfileUseCase);
      const result = await useCase.execute({ userId });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      setState({ status: 'loaded', profile: result.value });
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to load profile',
      });
    }
  }, [userId]);

  // Update profile
  const updateProfile = useCallback(
    async (update: {
      displayName?: string;
      preferredLanguage?: string;
      translationLanguage?: string;
      subtitleLanguage?: string;
      theme?: Theme;
    }) => {
      setState((prev) =>
        prev.status === 'loaded' ? { status: 'updating', profile: prev.profile } : prev,
      );
      try {
        const useCase = sdkContainer.resolve<UpdateProfileUseCase>(TOKENS.UpdateProfileUseCase);
        const result = await useCase.execute({ userId, update });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        setState({ status: 'loaded', profile: result.value });
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update profile',
        });
      }
    },
    [userId],
  );

  // Upload avatar
  const uploadAvatar = useCallback(
    async (file: File) => {
      setState((prev) =>
        prev.status === 'loaded' ? { status: 'updating', profile: prev.profile } : prev,
      );
      try {
        const useCase = sdkContainer.resolve<UploadAvatarUseCase>(TOKENS.UploadAvatarUseCase);
        const result = await useCase.execute({
          userId,
          avatar: {
            file,
            filename: file.name,
            mimeType: file.type,
          },
        });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        // Reload profile to get updated avatar URL
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to upload avatar',
        });
      }
    },
    [userId, loadProfile],
  );

  // Delete avatar
  const deleteAvatar = useCallback(async () => {
    setState((prev) =>
      prev.status === 'loaded' ? { status: 'updating', profile: prev.profile } : prev,
    );
    try {
      const useCase = sdkContainer.resolve<DeleteAvatarUseCase>(TOKENS.DeleteAvatarUseCase);
      const result = await useCase.execute({ userId });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      await loadProfile();
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to delete avatar',
      });
    }
  }, [userId, loadProfile]);

  // Update language
  const updateLanguage = useCallback(
    async (language: string, translationLanguage?: string, subtitleLanguage?: string) => {
      try {
        const useCase = sdkContainer.resolve<UpdateLanguagePreferenceUseCase>(
          TOKENS.UpdateLanguagePreferenceUseCase,
        );
        const result = await useCase.execute({
          userId,
          language,
          translationLanguage,
          subtitleLanguage,
        });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update language',
        });
      }
    },
    [userId, loadProfile],
  );

  // Update theme
  const updateTheme = useCallback(
    async (theme: Theme) => {
      try {
        const useCase = sdkContainer.resolve<UpdateThemeUseCase>(TOKENS.UpdateThemeUseCase);
        const result = await useCase.execute({ userId, theme });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update theme',
        });
      }
    },
    [userId, loadProfile],
  );

  // Update notification settings
  const updateNotifications = useCallback(
    async (settings: NotificationSettings) => {
      try {
        const useCase = sdkContainer.resolve<UpdateNotificationSettingsUseCase>(
          TOKENS.UpdateNotificationSettingsUseCase,
        );
        const result = await useCase.execute({ userId, settings });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update notifications',
        });
      }
    },
    [userId, loadProfile],
  );

  // Update privacy settings
  const updatePrivacy = useCallback(
    async (settings: PrivacySettings) => {
      try {
        const useCase = sdkContainer.resolve<UpdatePrivacySettingsUseCase>(
          TOKENS.UpdatePrivacySettingsUseCase,
        );
        const result = await useCase.execute({ userId, settings });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update privacy',
        });
      }
    },
    [userId, loadProfile],
  );

  // Update accessibility settings
  const updateAccessibility = useCallback(
    async (settings: AccessibilitySettings) => {
      try {
        const useCase = sdkContainer.resolve<UpdateAccessibilitySettingsUseCase>(
          TOKENS.UpdateAccessibilitySettingsUseCase,
        );
        const result = await useCase.execute({ userId, settings });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update accessibility',
        });
      }
    },
    [userId, loadProfile],
  );

  // Update presence
  const updatePresence = useCallback(
    async (presence: Presence) => {
      try {
        const useCase = sdkContainer.resolve<UpdatePresenceUseCase>(TOKENS.UpdatePresenceUseCase);
        const result = await useCase.execute({ userId, presence });
        if (result.isFailure) {
          setState({ status: 'error', error: result.error.message });
          return;
        }
        await loadProfile();
      } catch (err) {
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to update presence',
        });
      }
    },
    [userId, loadProfile],
  );

  // Deactivate account
  const deactivateAccount = useCallback(async () => {
    try {
      const useCase = sdkContainer.resolve<DeactivateAccountUseCase>(
        TOKENS.DeactivateAccountUseCase,
      );
      const result = await useCase.execute({ userId });
      if (result.isFailure) {
        setState({ status: 'error', error: result.error.message });
        return;
      }
      // Redirect to login after deactivation
      window.location.href = '/login';
    } catch (err) {
      setState({
        status: 'error',
        error: err instanceof Error ? err.message : 'Failed to deactivate account',
      });
    }
  }, [userId]);

  return {
    state,
    loadProfile,
    updateProfile,
    uploadAvatar,
    deleteAvatar,
    updateLanguage,
    updateTheme,
    updateNotifications,
    updatePrivacy,
    updateAccessibility,
    updatePresence,
    deactivateAccount,
  };
}