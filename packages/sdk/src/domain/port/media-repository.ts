import type { MeetingId, ParticipantId, Result } from '@aimeetx/types';

import type {
  AudioSession,
  AudioSessionId,
  MediaDevice,
  MediaDeviceId,
  MediaOrchestrationSession,
  MediaPlatformSession,
  MediaPlatformSessionId,
  MediaSession,
  MediaSessionId,
  NetworkSession,
  NetworkSessionId,
  OrchestrationSessionId,
  ScreenShareSession,
  ScreenShareSessionId,
  VideoSession,
  VideoSessionId,
} from '../model/media.js';

// ============================================================================
// Media Session Repository
// ============================================================================

/**
 * Input for creating a media session.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`.
 */
export interface CreateMediaSessionInput {
  readonly meetingId: MeetingId;
  readonly participantId: ParticipantId;
  readonly capabilities: {
    readonly supportsAudio: boolean;
    readonly supportsVideo: boolean;
    readonly supportsScreenShare: boolean;
    readonly maxAudioStreams: number;
    readonly maxVideoStreams: number;
  };
}

/**
 * Repository for media session persistence.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`.
 */
export interface MediaSessionRepository {
  /**
   * Create a new media session.
   */
  createSession(input: CreateMediaSessionInput): Promise<Result<MediaSession, Error>>;

  /**
   * Get a media session by ID.
   */
  getSession(sessionId: MediaSessionId): Promise<Result<MediaSession | null, Error>>;

  /**
   * Get active session for a participant.
   */
  getActiveSessionByParticipant(
    participantId: ParticipantId,
  ): Promise<Result<MediaSession | null, Error>>;

  /**
   * Update media session state.
   */
  updateSessionState(
    sessionId: MediaSessionId,
    state: MediaSession['state'],
  ): Promise<Result<MediaSession, Error>>;

  /**
   * Update transport state.
   */
  updateTransportState(
    sessionId: MediaSessionId,
    transportState: MediaSession['transportState'],
  ): Promise<Result<MediaSession, Error>>;

  /**
   * Update recovery state.
   */
  updateRecoveryState(
    sessionId: MediaSessionId,
    recoveryState: MediaSession['recoveryState'],
  ): Promise<Result<MediaSession, Error>>;

  /**
   * Close a media session.
   */
  closeSession(sessionId: MediaSessionId): Promise<Result<MediaSession, Error>>;

  /**
   * List all active sessions for a meeting.
   */
  listActiveSessionsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<MediaSession>, Error>>;
}

// ============================================================================
// Audio Session Repository
// ============================================================================

/**
 * Input for creating an audio session.
 *
 * Per `feature-media/audio-engine/SPECIFICATION.md`.
 */
export interface CreateAudioSessionInput {
  readonly mediaSessionId: MediaSessionId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly qualityProfile?: {
    readonly bitrateKbps: number;
    readonly sampleRateHz: number;
    readonly channels: 1 | 2;
    readonly codec: string;
    readonly echoCancellation: boolean;
    readonly noiseSuppression: boolean;
    readonly autoGainControl: boolean;
  };
}

/**
 * Repository for audio session persistence.
 *
 * Per `feature-media/audio-engine/SPECIFICATION.md`.
 */
export interface AudioSessionRepository {
  /**
   * Create a new audio session.
   */
  createSession(input: CreateAudioSessionInput): Promise<Result<AudioSession, Error>>;

  /**
   * Get an audio session by ID.
   */
  getSession(sessionId: AudioSessionId): Promise<Result<AudioSession | null, Error>>;

  /**
   * Get active audio session for a media session.
   */
  getActiveSessionByMediaSession(
    mediaSessionId: MediaSessionId,
  ): Promise<Result<AudioSession | null, Error>>;

  /**
   * Update audio session state.
   */
  updateSessionState(
    sessionId: AudioSessionId,
    state: AudioSession['state'],
  ): Promise<Result<AudioSession, Error>>;

  /**
   * Update audio quality profile.
   */
  updateQualityProfile(
    sessionId: AudioSessionId,
    profile: AudioSession['qualityProfile'],
  ): Promise<Result<AudioSession, Error>>;

  /**
   * Update audio metrics.
   */
  updateMetrics(
    sessionId: AudioSessionId,
    metrics: AudioSession['metrics'],
  ): Promise<Result<AudioSession, Error>>;

  /**
   * Close an audio session.
   */
  closeSession(sessionId: AudioSessionId): Promise<Result<AudioSession, Error>>;
}

// ============================================================================
// Video Session Repository
// ============================================================================

/**
 * Input for creating a video session.
 *
 * Per `feature-media/video-engine/SPECIFICATION.md`.
 */
export interface CreateVideoSessionInput {
  readonly mediaSessionId: MediaSessionId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly resolutionProfile?: {
    readonly width: number;
    readonly height: number;
    readonly label: string;
  };
  readonly frameRateProfile?: {
    readonly fps: number;
    readonly label: string;
  };
  readonly encodingProfile?: {
    readonly codec: string;
    readonly bitrateKbps: number;
    readonly keyFrameIntervalMs: number;
  };
}

/**
 * Repository for video session persistence.
 *
 * Per `feature-media/video-engine/SPECIFICATION.md`.
 */
export interface VideoSessionRepository {
  /**
   * Create a new video session.
   */
  createSession(input: CreateVideoSessionInput): Promise<Result<VideoSession, Error>>;

  /**
   * Get a video session by ID.
   */
  getSession(sessionId: VideoSessionId): Promise<Result<VideoSession | null, Error>>;

  /**
   * Get active video session for a media session.
   */
  getActiveSessionByMediaSession(
    mediaSessionId: MediaSessionId,
  ): Promise<Result<VideoSession | null, Error>>;

  /**
   * Update video session state.
   */
  updateSessionState(
    sessionId: VideoSessionId,
    state: VideoSession['state'],
  ): Promise<Result<VideoSession, Error>>;

  /**
   * Update resolution profile.
   */
  updateResolutionProfile(
    sessionId: VideoSessionId,
    profile: VideoSession['resolutionProfile'],
  ): Promise<Result<VideoSession, Error>>;

  /**
   * Update frame rate profile.
   */
  updateFrameRateProfile(
    sessionId: VideoSessionId,
    profile: VideoSession['frameRateProfile'],
  ): Promise<Result<VideoSession, Error>>;

  /**
   * Update encoding profile.
   */
  updateEncodingProfile(
    sessionId: VideoSessionId,
    profile: VideoSession['encodingProfile'],
  ): Promise<Result<VideoSession, Error>>;

  /**
   * Update video metrics.
   */
  updateMetrics(
    sessionId: VideoSessionId,
    metrics: VideoSession['metrics'],
  ): Promise<Result<VideoSession, Error>>;

  /**
   * Close a video session.
   */
  closeSession(sessionId: VideoSessionId): Promise<Result<VideoSession, Error>>;
}

// ============================================================================
// Network Session Repository
// ============================================================================

/**
 * Input for creating a network session.
 *
 * Per `feature-media/network-layer/SPECIFICATION.md`.
 */
export interface CreateNetworkSessionInput {
  readonly mediaSessionId: MediaSessionId;
  readonly routingProfile: 'mesh' | 'sfu' | 'hybrid';
}

/**
 * Repository for network session persistence.
 *
 * Per `feature-media/network-layer/SPECIFICATION.md`.
 */
export interface NetworkSessionRepository {
  /**
   * Create a new network session.
   */
  createSession(input: CreateNetworkSessionInput): Promise<Result<NetworkSession, Error>>;

  /**
   * Get a network session by ID.
   */
  getSession(sessionId: NetworkSessionId): Promise<Result<NetworkSession | null, Error>>;

  /**
   * Get network session for a media session.
   */
  getSessionByMediaSession(
    mediaSessionId: MediaSessionId,
  ): Promise<Result<NetworkSession | null, Error>>;

  /**
   * Update network session state.
   */
  updateSessionState(
    sessionId: NetworkSessionId,
    state: NetworkSession['state'],
  ): Promise<Result<NetworkSession, Error>>;

  /**
   * Update network metrics.
   */
  updateMetrics(
    sessionId: NetworkSessionId,
    metrics: NetworkSession['networkMetrics'],
  ): Promise<Result<NetworkSession, Error>>;

  /**
   * Update routing profile.
   */
  updateRoutingProfile(
    sessionId: NetworkSessionId,
    profile: NetworkSession['routingProfile'],
  ): Promise<Result<NetworkSession, Error>>;

  /**
   * Add a peer connection.
   */
  addPeerConnection(
    sessionId: NetworkSessionId,
    peerId: string,
  ): Promise<Result<NetworkSession, Error>>;

  /**
   * Remove a peer connection.
   */
  removePeerConnection(
    sessionId: NetworkSessionId,
    peerId: string,
  ): Promise<Result<NetworkSession, Error>>;

  /**
   * Close a network session.
   */
  closeSession(sessionId: NetworkSessionId): Promise<Result<NetworkSession, Error>>;
}

// ============================================================================
// Screen Share Session Repository
// ============================================================================

/**
 * Input for creating a screen share session.
 *
 * Per `feature-media/screen-share/SPECIFICATION.md`.
 */
export interface CreateScreenShareSessionInput {
  readonly mediaSessionId: MediaSessionId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly captureSource: 'screen' | 'window' | 'region';
  readonly captureProfile?: {
    readonly resolution: {
      readonly width: number;
      readonly height: number;
      readonly label: string;
    };
    readonly fps: number;
    readonly region: {
      readonly x: number;
      readonly y: number;
      readonly width: number;
      readonly height: number;
    } | null;
  };
}

/**
 * Repository for screen share session persistence.
 *
 * Per `feature-media/screen-share/SPECIFICATION.md`.
 */
export interface ScreenShareSessionRepository {
  /**
   * Create a new screen share session.
   */
  createSession(
    input: CreateScreenShareSessionInput,
  ): Promise<Result<ScreenShareSession, Error>>;

  /**
   * Get a screen share session by ID.
   */
  getSession(sessionId: ScreenShareSessionId): Promise<Result<ScreenShareSession | null, Error>>;

  /**
   * Get active screen share session for a participant.
   */
  getActiveSessionByParticipant(
    participantId: ParticipantId,
  ): Promise<Result<ScreenShareSession | null, Error>>;

  /**
   * Update screen share session state.
   */
  updateSessionState(
    sessionId: ScreenShareSessionId,
    state: ScreenShareSession['state'],
  ): Promise<Result<ScreenShareSession, Error>>;

  /**
   * Update capture source.
   */
  updateCaptureSource(
    sessionId: ScreenShareSessionId,
    source: ScreenShareSession['captureSource'],
  ): Promise<Result<ScreenShareSession, Error>>;

  /**
   * Update capture profile.
   */
  updateCaptureProfile(
    sessionId: ScreenShareSessionId,
    profile: ScreenShareSession['captureProfile'],
  ): Promise<Result<ScreenShareSession, Error>>;

  /**
   * Update screen metrics.
   */
  updateMetrics(
    sessionId: ScreenShareSessionId,
    metrics: ScreenShareSession['metrics'],
  ): Promise<Result<ScreenShareSession, Error>>;

  /**
   * Close a screen share session.
   */
  closeSession(sessionId: ScreenShareSessionId): Promise<Result<ScreenShareSession, Error>>;
}

// ============================================================================
// Media Device Repository
// ============================================================================

/**
 * Input for creating a media device.
 *
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
export interface CreateMediaDeviceInput {
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly type: 'camera' | 'microphone' | 'speaker' | 'screen_capture';
  readonly label: string;
  readonly capabilities: {
    readonly supportedResolutions: ReadonlyArray<{
      readonly width: number;
      readonly height: number;
      readonly label: string;
    }>;
    readonly supportedFrameRates: ReadonlyArray<number>;
    readonly maxResolution: {
      readonly width: number;
      readonly height: number;
      readonly label: string;
    } | null;
    readonly hasAutoFocus: boolean;
    readonly hasAutoExposure: boolean;
  };
}

/**
 * Repository for media device persistence.
 *
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
export interface MediaDeviceRepository {
  /**
   * Create/register a new device.
   */
  createDevice(input: CreateMediaDeviceInput): Promise<Result<MediaDevice, Error>>;

  /**
   * Get a device by ID.
   */
  getDevice(deviceId: MediaDeviceId): Promise<Result<MediaDevice | null, Error>>;

  /**
   * List all devices for a participant.
   */
  listDevicesByParticipant(
    participantId: ParticipantId,
  ): Promise<Result<ReadonlyArray<MediaDevice>, Error>>;

  /**
   * List devices by type for a participant.
   */
  listDevicesByType(
    participantId: ParticipantId,
    type: 'camera' | 'microphone' | 'speaker' | 'screen_capture',
  ): Promise<Result<ReadonlyArray<MediaDevice>, Error>>;

  /**
   * Get selected device by type for a participant.
   */
  getSelectedDeviceByType(
    participantId: ParticipantId,
    type: 'camera' | 'microphone' | 'speaker' | 'screen_capture',
  ): Promise<Result<MediaDevice | null, Error>>;

  /**
   * Select a device (deselects others of same type).
   */
  selectDevice(deviceId: MediaDeviceId): Promise<Result<MediaDevice, Error>>;

  /**
   * Deselect a device.
   */
  deselectDevice(deviceId: MediaDeviceId): Promise<Result<MediaDevice, Error>>;

  /**
   * Update device state.
   */
  updateDeviceState(
    deviceId: MediaDeviceId,
    state: MediaDevice['state'],
  ): Promise<Result<MediaDevice, Error>>;

  /**
   * Update device availability.
   */
  updateAvailability(
    deviceId: MediaDeviceId,
    isAvailable: boolean,
  ): Promise<Result<MediaDevice, Error>>;

  /**
   * Delete a device.
   */
  deleteDevice(deviceId: MediaDeviceId): Promise<Result<void, Error>>;
}

// ============================================================================
// Media Orchestration Session Repository
// ============================================================================

/**
 * Input for creating an orchestration session.
 *
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
export interface CreateOrchestrationSessionInput {
  readonly mediaSessionId: MediaSessionId;
  readonly policies?: {
    readonly maxAudioStreams: number;
    readonly maxVideoStreams: number;
    readonly allowScreenShare: boolean;
    readonly autoDegradeOnNetworkLoss: boolean;
    readonly recoveryModeEnabled: boolean;
    readonly priorityStreams: ReadonlyArray<'audio' | 'video' | 'screen_share'>;
  };
}

/**
 * Repository for media orchestration session persistence.
 *
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
export interface MediaOrchestrationSessionRepository {
  /**
   * Create a new orchestration session.
   */
  createSession(
    input: CreateOrchestrationSessionInput,
  ): Promise<Result<MediaOrchestrationSession, Error>>;

  /**
   * Get an orchestration session by ID.
   */
  getSession(
    sessionId: OrchestrationSessionId,
  ): Promise<Result<MediaOrchestrationSession | null, Error>>;

  /**
   * Get orchestration session for a media session.
   */
  getSessionByMediaSession(
    mediaSessionId: MediaSessionId,
  ): Promise<Result<MediaOrchestrationSession | null, Error>>;

  /**
   * Update global state.
   */
  updateGlobalState(
    sessionId: OrchestrationSessionId,
    state: MediaOrchestrationSession['globalState'],
  ): Promise<Result<MediaOrchestrationSession, Error>>;

  /**
   * Update subsystem states.
   */
  updateSubsystemStates(
    sessionId: OrchestrationSessionId,
    states: MediaOrchestrationSession['subsystemStates'],
  ): Promise<Result<MediaOrchestrationSession, Error>>;

  /**
   * Update health snapshot.
   */
  updateHealthSnapshot(
    sessionId: OrchestrationSessionId,
    snapshot: MediaOrchestrationSession['healthSnapshot'],
  ): Promise<Result<MediaOrchestrationSession, Error>>;

  /**
   * Update policies.
   */
  updatePolicies(
    sessionId: OrchestrationSessionId,
    policies: MediaOrchestrationSession['activePolicies'],
  ): Promise<Result<MediaOrchestrationSession, Error>>;

  /**
   * Close an orchestration session.
   */
  closeSession(
    sessionId: OrchestrationSessionId,
  ): Promise<Result<MediaOrchestrationSession, Error>>;
}

// ============================================================================
// Media Platform Session Repository
// ============================================================================

/**
 * Input for creating a platform session.
 *
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
export interface CreatePlatformSessionInput {
  readonly mediaSessionId: MediaSessionId;
  readonly orchestrationSessionId: OrchestrationSessionId;
  readonly sessionType: 'one_to_one_call' | 'group_call' | 'meeting' | 'webinar';
  readonly policies?: {
    readonly maxParticipants: number;
    readonly allowScreenShare: boolean;
    readonly recordingEnabled: boolean;
    readonly autoMuteOnJoin: boolean;
    readonly videoDefaultState: 'on' | 'off';
    readonly networkAdaptationMode: 'aggressive' | 'moderate' | 'conservative';
  };
}

/**
 * Input for adding a participant to a platform session.
 */
export interface AddPlatformParticipantInput {
  readonly participantId: ParticipantId;
  readonly userId: string;
  readonly displayName: string;
  readonly role: 'host' | 'co_host' | 'participant' | 'viewer';
}

/**
 * Repository for media platform session persistence.
 *
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
export interface MediaPlatformSessionRepository {
  /**
   * Create a new platform session.
   */
  createSession(input: CreatePlatformSessionInput): Promise<Result<MediaPlatformSession, Error>>;

  /**
   * Get a platform session by ID.
   */
  getSession(
    sessionId: MediaPlatformSessionId,
  ): Promise<Result<MediaPlatformSession | null, Error>>;

  /**
   * Get platform session for a media session.
   */
  getSessionByMediaSession(
    mediaSessionId: MediaSessionId,
  ): Promise<Result<MediaPlatformSession | null, Error>>;

  /**
   * Update platform session state.
   */
  updateSessionState(
    sessionId: MediaPlatformSessionId,
    state: MediaPlatformSession['state'],
  ): Promise<Result<MediaPlatformSession, Error>>;

  /**
   * Add a participant to the session.
   */
  addParticipant(
    sessionId: MediaPlatformSessionId,
    input: AddPlatformParticipantInput,
  ): Promise<Result<MediaPlatformSession, Error>>;

  /**
   * Remove a participant from the session.
   */
  removeParticipant(
    sessionId: MediaPlatformSessionId,
    participantId: ParticipantId,
  ): Promise<Result<MediaPlatformSession, Error>>;

  /**
   * Update participant role.
   */
  updateParticipantRole(
    sessionId: MediaPlatformSessionId,
    participantId: ParticipantId,
    role: 'host' | 'co_host' | 'participant' | 'viewer',
  ): Promise<Result<MediaPlatformSession, Error>>;

  /**
   * Update session policies.
   */
  updatePolicies(
    sessionId: MediaPlatformSessionId,
    policies: MediaPlatformSession['activePolicies'],
  ): Promise<Result<MediaPlatformSession, Error>>;

  /**
   * End the platform session.
   */
  endSession(sessionId: MediaPlatformSessionId): Promise<Result<MediaPlatformSession, Error>>;
}