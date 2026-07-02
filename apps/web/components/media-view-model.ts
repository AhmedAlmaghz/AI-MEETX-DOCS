'use client';

import { useCallback, useEffect, useState } from 'react';

import type { MeetingId, ParticipantId } from '@aimeetx/types';

import {
  ActivateMediaSessionUseCase,
  AdaptMediaQualityUseCase,
  CloseMediaSessionUseCase,
  CreateMediaSessionUseCase,
  CreateNetworkSessionUseCase,
  CreateOrchestrationSessionUseCase,
  CreatePlatformSessionUseCase,
  DiscoverDevicesUseCase,
  EnableCameraUseCase,
  EnableMicrophoneUseCase,
  GetMediaSessionUseCase,
  RegisterDeviceUseCase,
  SelectDeviceUseCase,
  ToggleScreenShareUseCase,
  TOKENS,
  type AudioSession,
  type CaptureSource,
  type MediaDevice,
  type MediaSession,
  type MediaSessionState,
  type NetworkSession,
  type ScreenShareSession,
  type SessionType,
  type VideoSession,
} from '@aimeetx/sdk';

import { sdkContainer } from '@aimeetx/sdk';

// ============================================================================
// Media State Types
// ============================================================================

/**
 * Media session state for the UI.
 *
 * Per phase-4.yaml: MediaEngineViewModel with session lifecycle tracking.
 */
export type MediaSessionUIState =
  | { readonly status: 'idle' }
  | { readonly status: 'connecting' }
  | { readonly status: 'connected'; readonly session: MediaSession }
  | { readonly status: 'active'; readonly session: MediaSession }
  | { readonly status: 'paused'; readonly session: MediaSession }
  | { readonly status: 'error'; readonly error: string };

/**
 * Audio state for the UI.
 */
export type AudioUIState =
  | { readonly status: 'idle' }
  | { readonly status: 'enabled'; readonly session: AudioSession }
  | { readonly status: 'muted' }
  | { readonly status: 'error'; readonly error: string };

/**
 * Video state for the UI.
 */
export type VideoUIState =
  | { readonly status: 'idle' }
  | { readonly status: 'enabled'; readonly session: VideoSession }
  | { readonly status: 'disabled' }
  | { readonly status: 'error'; readonly error: string };

/**
 * Screen share state for the UI.
 */
export type ScreenShareUIState =
  | { readonly status: 'idle' }
  | { readonly status: 'active'; readonly session: ScreenShareSession }
  | { readonly status: 'error'; readonly error: string };

/**
 * Device list state for the UI.
 */
export type DevicesUIState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'loaded'; readonly devices: ReadonlyArray<MediaDevice> }
  | { readonly status: 'error'; readonly error: string };

/**
 * Network state for the UI.
 */
export type NetworkUIState =
  | { readonly status: 'idle' }
  | { readonly status: 'connecting' }
  | { readonly status: 'connected'; readonly session: NetworkSession }
  | { readonly status: 'degraded'; readonly quality: string }
  | { readonly status: 'disconnected' }
  | { readonly status: 'error'; readonly error: string };

/**
 * Combined media state for the UI.
 */
export interface MediaState {
  readonly session: MediaSessionUIState;
  readonly audio: AudioUIState;
  readonly video: VideoUIState;
  readonly screenShare: ScreenShareUIState;
  readonly devices: DevicesUIState;
  readonly network: NetworkUIState;
}

/**
 * Initial media state.
 */
const INITIAL_MEDIA_STATE: MediaState = {
  session: { status: 'idle' },
  audio: { status: 'idle' },
  video: { status: 'idle' },
  screenShare: { status: 'idle' },
  devices: { status: 'idle' },
  network: { status: 'idle' },
};

// ============================================================================
// Media ViewModel Hook
// ============================================================================

/**
 * useMediaViewModel — React hook for managing media session state.
 *
 * Per phase-4.yaml: MediaEngineViewModel provides controls for:
 * - Session lifecycle (join, leave)
 * - Audio controls (enable, mute)
 * - Video controls (enable, disable)
 * - Screen share controls (start, stop)
 * - Device management (select, switch)
 * - Quality adaptation
 */
export function useMediaViewModel(
  meetingId: MeetingId,
  participantId: ParticipantId,
) {
  const [state, setState] = useState<MediaState>(INITIAL_MEDIA_STATE);

  // ========================================================================
  // Session Lifecycle
  // ========================================================================

  /**
   * Join media session — creates and activates a media session.
   */
  const joinSession = useCallback(async () => {
    setState((prev) => ({ ...prev, session: { status: 'connecting' } }));

    try {
      // Create media session
      const createUseCase = sdkContainer.resolve<CreateMediaSessionUseCase>(
        TOKENS.CreateMediaSessionUseCase,
      );
      const createResult = await createUseCase.execute({
        input: {
          meetingId,
          participantId,
          capabilities: {
            supportsAudio: true,
            supportsVideo: true,
            supportsScreenShare: true,
            maxAudioStreams: 1,
            maxVideoStreams: 1,
          },
        },
      });

      if (createResult.isFailure) {
        setState((prev) => ({
          ...prev,
          session: { status: 'error', error: createResult.error.message },
        }));
        return;
      }

      const session = createResult.value;

      // Activate session
      const activateUseCase = sdkContainer.resolve<ActivateMediaSessionUseCase>(
        TOKENS.ActivateMediaSessionUseCase,
      );
      const activateResult = await activateUseCase.execute({
        sessionId: session.id,
      });

      if (activateResult.isFailure) {
        setState((prev) => ({
          ...prev,
          session: { status: 'error', error: activateResult.error.message },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        session: { status: 'active', session: activateResult.value },
      }));

      // Create network session
      const networkUseCase = sdkContainer.resolve<CreateNetworkSessionUseCase>(
        TOKENS.CreateNetworkSessionUseCase,
      );
      const networkResult = await networkUseCase.execute({
        mediaSessionId: session.id,
        routingProfile: 'sfu',
      });

      if (networkResult.isFailure) {
        setState((prev) => ({
          ...prev,
          network: { status: 'error', error: networkResult.error.message },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        network: { status: 'connected', session: networkResult.value },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        session: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to join session',
        },
      }));
    }
  }, [meetingId, participantId]);

  /**
   * Leave media session — closes the media session.
   */
  const leaveSession = useCallback(async () => {
    const currentState = state.session;
    if (currentState.status !== 'active' && currentState.status !== 'connected') {
      return;
    }

    try {
      const useCase = sdkContainer.resolve<CloseMediaSessionUseCase>(
        TOKENS.CloseMediaSessionUseCase,
      );
      const result = await useCase.execute({
        sessionId: currentState.session.id,
        reason: 'user_left',
      });

      if (result.isFailure) {
        setState((prev) => ({
          ...prev,
          session: { status: 'error', error: result.error.message },
        }));
        return;
      }

      setState(INITIAL_MEDIA_STATE);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        session: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to leave session',
        },
      }));
    }
  }, [state.session]);

  // ========================================================================
  // Audio Controls
  // ========================================================================

  /**
   * Enable microphone — creates an audio session.
   */
  const enableMicrophone = useCallback(async () => {
    const sessionState = state.session;
    if (sessionState.status !== 'active') {
      return;
    }

    try {
      const useCase = sdkContainer.resolve<EnableMicrophoneUseCase>(
        TOKENS.EnableMicrophoneUseCase,
      );
      const result = await useCase.execute({
        mediaSessionId: sessionState.session.id,
        participantId,
        meetingId,
      });

      if (result.isFailure) {
        setState((prev) => ({
          ...prev,
          audio: { status: 'error', error: result.error.message },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        audio: { status: 'enabled', session: result.value },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        audio: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to enable microphone',
        },
      }));
    }
  }, [state.session, participantId, meetingId]);

  /**
   * Disable microphone.
   */
  const disableMicrophone = useCallback(() => {
    setState((prev) => ({
      ...prev,
      audio: { status: 'muted' },
    }));
  }, []);

  // ========================================================================
  // Video Controls
  // ========================================================================

  /**
   * Enable camera — creates a video session.
   */
  const enableCamera = useCallback(async () => {
    const sessionState = state.session;
    if (sessionState.status !== 'active') {
      return;
    }

    try {
      const useCase = sdkContainer.resolve<EnableCameraUseCase>(
        TOKENS.EnableCameraUseCase,
      );
      const result = await useCase.execute({
        mediaSessionId: sessionState.session.id,
        participantId,
        meetingId,
      });

      if (result.isFailure) {
        setState((prev) => ({
          ...prev,
          video: { status: 'error', error: result.error.message },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        video: { status: 'enabled', session: result.value },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        video: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to enable camera',
        },
      }));
    }
  }, [state.session, participantId, meetingId]);

  /**
   * Disable camera.
   */
  const disableCamera = useCallback(() => {
    setState((prev) => ({
      ...prev,
      video: { status: 'disabled' },
    }));
  }, []);

  // ========================================================================
  // Screen Share Controls
  // ========================================================================

  /**
   * Start screen share.
   */
  const startScreenShare = useCallback(
    async (source: CaptureSource = 'screen') => {
      const sessionState = state.session;
      if (sessionState.status !== 'active') {
        return;
      }

      try {
        const useCase = sdkContainer.resolve<ToggleScreenShareUseCase>(
          TOKENS.ToggleScreenShareUseCase,
        );
        const result = await useCase.execute({
          mediaSessionId: sessionState.session.id,
          participantId,
          meetingId,
          captureSource: source,
          enable: true,
        });

        if (result.isFailure) {
          setState((prev) => ({
            ...prev,
            screenShare: { status: 'error', error: result.error.message },
          }));
          return;
        }

        const screenSession = result.value;
        if (screenSession) {
          setState((prev) => ({
            ...prev,
            screenShare: { status: 'active', session: screenSession },
          }));
        }
      } catch (err) {
        setState((prev) => ({
          ...prev,
          screenShare: {
            status: 'error',
            error: err instanceof Error ? err.message : 'Failed to start screen share',
          },
        }));
      }
    },
    [state.session, participantId, meetingId],
  );

  /**
   * Stop screen share.
   */
  const stopScreenShare = useCallback(async () => {
    const sessionState = state.session;
    if (sessionState.status !== 'active') {
      return;
    }

    try {
      const useCase = sdkContainer.resolve<ToggleScreenShareUseCase>(
        TOKENS.ToggleScreenShareUseCase,
      );
      await useCase.execute({
        mediaSessionId: sessionState.session.id,
        participantId,
        meetingId,
        captureSource: 'screen',
        enable: false,
      });

      setState((prev) => ({
        ...prev,
        screenShare: { status: 'idle' },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        screenShare: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to stop screen share',
        },
      }));
    }
  }, [state.session, participantId, meetingId]);

  // ========================================================================
  // Device Management
  // ========================================================================

  /**
   * Discover available devices.
   */
  const discoverDevices = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      devices: { status: 'loading' },
    }));

    try {
      const useCase = sdkContainer.resolve<DiscoverDevicesUseCase>(
        TOKENS.DiscoverDevicesUseCase,
      );
      const result = await useCase.execute({
        participantId,
        meetingId,
      });

      if (result.isFailure) {
        setState((prev) => ({
          ...prev,
          devices: { status: 'error', error: result.error.message },
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        devices: { status: 'loaded', devices: result.value },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        devices: {
          status: 'error',
          error: err instanceof Error ? err.message : 'Failed to discover devices',
        },
      }));
    }
  }, [participantId, meetingId]);

  /**
   * Select a device.
   */
  const selectDevice = useCallback(async (deviceId: string) => {
    try {
      const useCase = sdkContainer.resolve<SelectDeviceUseCase>(
        TOKENS.SelectDeviceUseCase,
      );
      const result = await useCase.execute({
        deviceId,
        participantId,
      });

      if (result.isFailure) {
        // Error handling
        return;
      }

      // Refresh device list
      await discoverDevices();
    } catch (err) {
      // Error handling
    }
  }, [participantId, discoverDevices]);

  // ========================================================================
  // Quality Adaptation
  // ========================================================================

  /**
   * Adapt media quality based on network conditions.
   */
  const adaptQuality = useCallback(
    async (targetQuality: 'low' | 'medium' | 'high') => {
      const sessionState = state.session;
      if (sessionState.status !== 'active') {
        return;
      }

      try {
        const useCase = sdkContainer.resolve<AdaptMediaQualityUseCase>(
          TOKENS.AdaptMediaQualityUseCase,
        );
        const result = await useCase.execute({
          mediaSessionId: sessionState.session.id,
          targetQuality,
        });

        if (result.isFailure) {
          // Error handling
          return;
        }

        // Update audio/video state with new sessions
        const { audio, video } = result.value;
        setState((prev) => ({
          ...prev,
          audio: audio
            ? { status: 'enabled', session: audio }
            : prev.audio,
          video: video
            ? { status: 'enabled', session: video }
            : prev.video,
        }));
      } catch (err) {
        // Error handling
      }
    },
    [state.session],
  );

  // ========================================================================
  // Return API
  // ========================================================================

  return {
    // State
    state,

    // Session lifecycle
    joinSession,
    leaveSession,

    // Audio controls
    enableMicrophone,
    disableMicrophone,

    // Video controls
    enableCamera,
    disableCamera,

    // Screen share controls
    startScreenShare,
    stopScreenShare,

    // Device management
    discoverDevices,
    selectDevice,

    // Quality adaptation
    adaptQuality,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if media session is active.
 */
export function isMediaActive(state: MediaSessionUIState): boolean {
  return state.status === 'active';
}

/**
 * Check if audio is enabled.
 */
export function isAudioEnabled(state: AudioUIState): boolean {
  return state.status === 'enabled';
}

/**
 * Check if video is enabled.
 */
export function isVideoEnabled(state: VideoUIState): boolean {
  return state.status === 'enabled';
}

/**
 * Check if screen share is active.
 */
export function isScreenShareActive(state: ScreenShareUIState): boolean {
  return state.status === 'active';
}

/**
 * Get session ID from state.
 */
export function getSessionId(state: MediaSessionUIState): string | null {
  if (state.status === 'active' || state.status === 'connected') {
    return state.session.id;
  }
  return null;
}