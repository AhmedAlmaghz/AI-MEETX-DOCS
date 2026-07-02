import { inject, injectable } from 'tsyringe';

import type { MeetingId, ParticipantId, Result, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type {
  AudioSession,
  CaptureSource,
  MediaDevice,
  MediaOrchestrationSession,
  MediaPlatformSession,
  MediaSession,
  NetworkSession,
  OrchestrationPolicy,
  ScreenShareSession,
  SessionPolicy,
  SessionType,
  VideoSession,
} from '../model/media.js';
import {
  DEFAULT_AUDIO_QUALITY,
  DEFAULT_ORCHESTRATION_POLICY,
  DEFAULT_SESSION_POLICY,
  DEFAULT_VIDEO_ENCODING,
  DEFAULT_VIDEO_FRAME_RATE,
  DEFAULT_VIDEO_RESOLUTION,
  isDeviceSelectable,
  isMediaSessionActive,
  isMediaSessionTerminal,
} from '../model/media.js';
import type {
  AudioSessionRepository,
  CreateAudioSessionInput,
  CreateMediaDeviceInput,
  CreateMediaSessionInput,
  CreateNetworkSessionInput,
  CreateOrchestrationSessionInput,
  CreatePlatformSessionInput,
  CreateScreenShareSessionInput,
  CreateVideoSessionInput,
  MediaDeviceRepository,
  MediaOrchestrationSessionRepository,
  MediaPlatformSessionRepository,
  MediaSessionRepository,
  NetworkSessionRepository,
  ScreenShareSessionRepository,
  VideoSessionRepository,
} from '../port/media-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Helpers
// ============================================================================

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
// CreateMediaSessionUseCase
// ============================================================================

/**
 * Command for CreateMediaSessionUseCase.
 */
export interface CreateMediaSessionCommand {
  readonly input: CreateMediaSessionInput;
}

/**
 * CreateMediaSessionUseCase — creates a new media session.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`: creates session in CREATED state.
 */
@injectable()
export class CreateMediaSessionUseCase
  implements UseCase<CreateMediaSessionCommand, MediaSession, Error>
{
  constructor(
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateMediaSessionCommand): Promise<Result<MediaSession, Error>> {
    const { input } = command;

    // Check for existing active session
    const existingResult = await this.mediaSessionRepository.getActiveSessionByParticipant(
      input.participantId,
    );
    if (existingResult.isFailure) {
      return failure(existingResult.error);
    }
    if (existingResult.value) {
      return failure(new Error('Participant already has an active media session'));
    }

    // Create session
    const result = await this.mediaSessionRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const session = result.value;

    // Publish MediaSessionCreatedEvent
    this.eventBus.publish(
      buildEvent('MediaSessionCreated', '@aimeetx/sdk/media', {
        sessionId: session.id,
        meetingId: session.meetingId,
        participantId: session.participantId,
        createdAt: session.createdAt,
      }),
    );

    return success(session);
  }
}

// ============================================================================
// ActivateMediaSessionUseCase
// ============================================================================

/**
 * Command for ActivateMediaSessionUseCase.
 */
export interface ActivateMediaSessionCommand {
  readonly sessionId: string;
}

/**
 * ActivateMediaSessionUseCase — activates a media session.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`: transitions to ACTIVE state.
 */
@injectable()
export class ActivateMediaSessionUseCase
  implements UseCase<ActivateMediaSessionCommand, MediaSession, Error>
{
  constructor(
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ActivateMediaSessionCommand): Promise<Result<MediaSession, Error>> {
    const { sessionId } = command;

    // Get session
    const sessionResult = await this.mediaSessionRepository.getSession(
      sessionId as import('../model/media.js').MediaSessionId,
    );
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Media session not found'));
    }

    const session = sessionResult.value;

    // Check if already terminal
    if (isMediaSessionTerminal(session.state)) {
      return failure(new Error('Cannot activate a closed session'));
    }

    // Check if already active
    if (isMediaSessionActive(session.state)) {
      return failure(new Error('Session is already active'));
    }

    // Update state to active
    const result = await this.mediaSessionRepository.updateSessionState(
      sessionId as import('../model/media.js').MediaSessionId,
      'active',
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    const activatedSession = result.value;

    // Publish MediaSessionActivatedEvent
    this.eventBus.publish(
      buildEvent('MediaSessionActivated', '@aimeetx/sdk/media', {
        sessionId: activatedSession.id,
        meetingId: activatedSession.meetingId,
        participantId: activatedSession.participantId,
        activatedAt: activatedSession.updatedAt,
      }),
    );

    return success(activatedSession);
  }
}

// ============================================================================
// CloseMediaSessionUseCase
// ============================================================================

/**
 * Command for CloseMediaSessionUseCase.
 */
export interface CloseMediaSessionCommand {
  readonly sessionId: string;
  readonly reason: 'user_left' | 'meeting_ended' | 'error' | 'timeout';
}

/**
 * CloseMediaSessionUseCase — closes a media session.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`: transitions to CLOSED state.
 */
@injectable()
export class CloseMediaSessionUseCase
  implements UseCase<CloseMediaSessionCommand, MediaSession, Error>
{
  constructor(
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CloseMediaSessionCommand): Promise<Result<MediaSession, Error>> {
    const { sessionId, reason } = command;

    // Get session
    const sessionResult = await this.mediaSessionRepository.getSession(
      sessionId as import('../model/media.js').MediaSessionId,
    );
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Media session not found'));
    }

    const session = sessionResult.value;

    // Check if already closed
    if (isMediaSessionTerminal(session.state)) {
      return failure(new Error('Session is already closed'));
    }

    // Close session
    const result = await this.mediaSessionRepository.closeSession(
      sessionId as import('../model/media.js').MediaSessionId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    const closedSession = result.value;

    // Publish MediaSessionClosedEvent
    this.eventBus.publish(
      buildEvent('MediaSessionClosed', '@aimeetx/sdk/media', {
        sessionId: closedSession.id,
        meetingId: closedSession.meetingId,
        participantId: closedSession.participantId,
        closedAt: closedSession.closedAt,
        reason,
      }),
    );

    return success(closedSession);
  }
}

// ============================================================================
// EnableCameraUseCase
// ============================================================================

/**
 * Command for EnableCameraUseCase.
 */
export interface EnableCameraCommand {
  readonly mediaSessionId: string;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
}

/**
 * EnableCameraUseCase — creates a video session for camera.
 *
 * Per phase-4.yaml: EnableCameraUseCase.
 */
@injectable()
export class EnableCameraUseCase
  implements UseCase<EnableCameraCommand, VideoSession, Error>
{
  constructor(
    @inject(TOKENS.VideoSessionRepository)
    private readonly videoSessionRepository: VideoSessionRepository,
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EnableCameraCommand): Promise<Result<VideoSession, Error>> {
    const { mediaSessionId, participantId, meetingId } = command;

    // Check media session is active
    const sessionResult = await this.mediaSessionRepository.getSession(
      mediaSessionId as import('../model/media.js').MediaSessionId,
    );
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Media session not found'));
    }
    if (!isMediaSessionActive(sessionResult.value.state)) {
      return failure(new Error('Media session must be active to enable camera'));
    }

    // Check for existing video session
    const existingResult = await this.videoSessionRepository.getActiveSessionByMediaSession(
      mediaSessionId as import('../model/media.js').MediaSessionId,
    );
    if (existingResult.isFailure) {
      return failure(existingResult.error);
    }
    if (existingResult.value) {
      return failure(new Error('Video session already exists for this media session'));
    }

    // Create video session with defaults
    const input: CreateVideoSessionInput = {
      mediaSessionId: mediaSessionId as import('../model/media.js').MediaSessionId,
      participantId,
      meetingId,
      resolutionProfile: DEFAULT_VIDEO_RESOLUTION,
      frameRateProfile: DEFAULT_VIDEO_FRAME_RATE,
      encodingProfile: DEFAULT_VIDEO_ENCODING,
    };

    const result = await this.videoSessionRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const videoSession = result.value;

    // Publish VideoSessionCreatedEvent
    this.eventBus.publish(
      buildEvent('VideoSessionCreated', '@aimeetx/sdk/media', {
        videoSessionId: videoSession.id,
        mediaSessionId: videoSession.mediaSessionId,
        participantId: videoSession.participantId,
        meetingId: videoSession.meetingId,
        createdAt: videoSession.createdAt,
      }),
    );

    return success(videoSession);
  }
}

// ============================================================================
// EnableMicrophoneUseCase
// ============================================================================

/**
 * Command for EnableMicrophoneUseCase.
 */
export interface EnableMicrophoneCommand {
  readonly mediaSessionId: string;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
}

/**
 * EnableMicrophoneUseCase — creates an audio session for microphone.
 *
 * Per phase-4.yaml: EnableMicrophoneUseCase.
 */
@injectable()
export class EnableMicrophoneUseCase
  implements UseCase<EnableMicrophoneCommand, AudioSession, Error>
{
  constructor(
    @inject(TOKENS.AudioSessionRepository)
    private readonly audioSessionRepository: AudioSessionRepository,
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: EnableMicrophoneCommand): Promise<Result<AudioSession, Error>> {
    const { mediaSessionId, participantId, meetingId } = command;

    // Check media session is active
    const sessionResult = await this.mediaSessionRepository.getSession(
      mediaSessionId as import('../model/media.js').MediaSessionId,
    );
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Media session not found'));
    }
    if (!isMediaSessionActive(sessionResult.value.state)) {
      return failure(new Error('Media session must be active to enable microphone'));
    }

    // Check for existing audio session
    const existingResult = await this.audioSessionRepository.getActiveSessionByMediaSession(
      mediaSessionId as import('../model/media.js').MediaSessionId,
    );
    if (existingResult.isFailure) {
      return failure(existingResult.error);
    }
    if (existingResult.value) {
      return failure(new Error('Audio session already exists for this media session'));
    }

    // Create audio session with defaults
    const input: CreateAudioSessionInput = {
      mediaSessionId: mediaSessionId as import('../model/media.js').MediaSessionId,
      participantId,
      meetingId,
      qualityProfile: DEFAULT_AUDIO_QUALITY,
    };

    const result = await this.audioSessionRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const audioSession = result.value;

    // Publish AudioSessionCreatedEvent
    this.eventBus.publish(
      buildEvent('AudioSessionCreated', '@aimeetx/sdk/media', {
        audioSessionId: audioSession.id,
        mediaSessionId: audioSession.mediaSessionId,
        participantId: audioSession.participantId,
        meetingId: audioSession.meetingId,
        createdAt: audioSession.createdAt,
      }),
    );

    return success(audioSession);
  }
}

// ============================================================================
// ToggleScreenShareUseCase
// ============================================================================

/**
 * Command for ToggleScreenShareUseCase.
 */
export interface ToggleScreenShareCommand {
  readonly mediaSessionId: string;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly captureSource: CaptureSource;
  readonly enable: boolean;
}

/**
 * ToggleScreenShareUseCase — starts or stops screen sharing.
 *
 * Per phase-4.yaml: ToggleScreenShareUseCase.
 */
@injectable()
export class ToggleScreenShareUseCase
  implements UseCase<ToggleScreenShareCommand, ScreenShareSession | null, Error>
{
  constructor(
    @inject(TOKENS.ScreenShareSessionRepository)
    private readonly screenShareSessionRepository: ScreenShareSessionRepository,
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: ToggleScreenShareCommand,
  ): Promise<Result<ScreenShareSession | null, Error>> {
    const { mediaSessionId, participantId, meetingId, captureSource, enable } = command;

    // Check media session is active
    const sessionResult = await this.mediaSessionRepository.getSession(
      mediaSessionId as import('../model/media.js').MediaSessionId,
    );
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }
    if (!sessionResult.value) {
      return failure(new Error('Media session not found'));
    }
    if (!isMediaSessionActive(sessionResult.value.state)) {
      return failure(new Error('Media session must be active for screen share'));
    }

    if (enable) {
      // Check for existing screen share
      const existingResult =
        await this.screenShareSessionRepository.getActiveSessionByParticipant(participantId);
      if (existingResult.isFailure) {
        return failure(existingResult.error);
      }
      if (existingResult.value) {
        return failure(new Error('Screen share already active for this participant'));
      }

      // Create screen share session
      const input: CreateScreenShareSessionInput = {
        mediaSessionId: mediaSessionId as import('../model/media.js').MediaSessionId,
        participantId,
        meetingId,
        captureSource,
        captureProfile: {
          resolution: { width: 1920, height: 1080, label: '1080p' },
          fps: 15,
          region: null,
        },
      };

      const result = await this.screenShareSessionRepository.createSession(input);
      if (result.isFailure) {
        return failure(result.error);
      }

      const screenSession = result.value;

      // Publish ScreenShareSessionCreatedEvent
      this.eventBus.publish(
        buildEvent('ScreenShareSessionCreated', '@aimeetx/sdk/media', {
          screenShareSessionId: screenSession.id,
          mediaSessionId: screenSession.mediaSessionId,
          participantId: screenSession.participantId,
          meetingId: screenSession.meetingId,
          captureSource: screenSession.captureSource,
          createdAt: screenSession.createdAt,
        }),
      );

      return success(screenSession);
    } else {
      // Stop screen share
      const existingResult =
        await this.screenShareSessionRepository.getActiveSessionByParticipant(participantId);
      if (existingResult.isFailure) {
        return failure(existingResult.error);
      }
      if (!existingResult.value) {
        return success(null); // No active screen share
      }

      const result = await this.screenShareSessionRepository.closeSession(existingResult.value.id);
      if (result.isFailure) {
        return failure(result.error);
      }

      // Publish ScreenShareSessionClosedEvent
      this.eventBus.publish(
        buildEvent('ScreenShareSessionClosed', '@aimeetx/sdk/media', {
          screenShareSessionId: result.value.id,
          mediaSessionId: result.value.mediaSessionId,
          closedAt: result.value.updatedAt,
        }),
      );

      return success(null);
    }
  }
}

// ============================================================================
// SelectDeviceUseCase
// ============================================================================

/**
 * Command for SelectDeviceUseCase.
 */
export interface SelectDeviceCommand {
  readonly deviceId: string;
  readonly participantId: ParticipantId;
}

/**
 * SelectDeviceUseCase — selects a media device.
 *
 * Per phase-4.yaml: SelectDeviceUseCase.
 * Per `feature-media/devices/SPECIFICATION.md`: only one active device per type.
 */
@injectable()
export class SelectDeviceUseCase
  implements UseCase<SelectDeviceCommand, MediaDevice, Error>
{
  constructor(
    @inject(TOKENS.MediaDeviceRepository)
    private readonly mediaDeviceRepository: MediaDeviceRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SelectDeviceCommand): Promise<Result<MediaDevice, Error>> {
    const { deviceId, participantId } = command;

    // Get device
    const deviceResult = await this.mediaDeviceRepository.getDevice(
      deviceId as import('../model/media.js').MediaDeviceId,
    );
    if (deviceResult.isFailure) {
      return failure(deviceResult.error);
    }
    if (!deviceResult.value) {
      return failure(new Error('Device not found'));
    }

    const device = deviceResult.value;

    // Check device belongs to participant
    if (device.participantId !== participantId) {
      return failure(new Error('Device does not belong to this participant'));
    }

    // Check device is selectable
    if (!isDeviceSelectable(device.state)) {
      return failure(new Error(`Device is not available (state: ${device.state})`));
    }

    // Deselect current device of same type
    const currentSelected = await this.mediaDeviceRepository.getSelectedDeviceByType(
      participantId,
      device.type,
    );
    if (currentSelected.isFailure) {
      return failure(currentSelected.error);
    }
    if (currentSelected.value && currentSelected.value.id !== deviceId) {
      await this.mediaDeviceRepository.deselectDevice(
        currentSelected.value.id as import('../model/media.js').MediaDeviceId,
      );
    }

    // Select device
    const result = await this.mediaDeviceRepository.selectDevice(
      deviceId as import('../model/media.js').MediaDeviceId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    const selectedDevice = result.value;

    // Publish DeviceSelectedEvent
    this.eventBus.publish(
      buildEvent('DeviceSelected', '@aimeetx/sdk/media', {
        deviceId: selectedDevice.id,
        participantId: selectedDevice.participantId,
        meetingId: selectedDevice.meetingId,
        deviceType: selectedDevice.type,
        label: selectedDevice.label,
        selectedAt: selectedDevice.lastUpdatedAt,
      }),
    );

    return success(selectedDevice);
  }
}

// ============================================================================
// DiscoverDevicesUseCase
// ============================================================================

/**
 * Command for DiscoverDevicesUseCase.
 */
export interface DiscoverDevicesCommand {
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
}

/**
 * DiscoverDevicesUseCase — lists available devices for a participant.
 *
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
@injectable()
export class DiscoverDevicesUseCase
  implements UseCase<DiscoverDevicesCommand, ReadonlyArray<MediaDevice>, Error>
{
  constructor(
    @inject(TOKENS.MediaDeviceRepository)
    private readonly mediaDeviceRepository: MediaDeviceRepository,
  ) {}

  async execute(
    command: DiscoverDevicesCommand,
  ): Promise<Result<ReadonlyArray<MediaDevice>, Error>> {
    const result = await this.mediaDeviceRepository.listDevicesByParticipant(
      command.participantId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// AdaptMediaQualityUseCase
// ============================================================================

/**
 * Command for AdaptMediaQualityUseCase.
 */
export interface AdaptMediaQualityCommand {
  readonly mediaSessionId: string;
  readonly targetQuality: 'low' | 'medium' | 'high';
}

/**
 * AdaptMediaQualityUseCase — adapts media quality based on network conditions.
 *
 * Per phase-4.yaml: AdaptMediaQualityUseCase.
 */
@injectable()
export class AdaptMediaQualityUseCase
  implements UseCase<AdaptMediaQualityCommand, { audio: AudioSession | null; video: VideoSession | null }, Error>
{
  constructor(
    @inject(TOKENS.AudioSessionRepository)
    private readonly audioSessionRepository: AudioSessionRepository,
    @inject(TOKENS.VideoSessionRepository)
    private readonly videoSessionRepository: VideoSessionRepository,
  ) {}

  async execute(
    command: AdaptMediaQualityCommand,
  ): Promise<Result<{ audio: AudioSession | null; video: VideoSession | null }, Error>> {
    const { mediaSessionId, targetQuality } = command;

    const mediaSessionIdTyped = mediaSessionId as import('../model/media.js').MediaSessionId;

    // Get current sessions
    const audioResult =
      await this.audioSessionRepository.getActiveSessionByMediaSession(mediaSessionIdTyped);
    const videoResult =
      await this.videoSessionRepository.getActiveSessionByMediaSession(mediaSessionIdTyped);

    if (audioResult.isFailure) {
      return failure(audioResult.error);
    }
    if (videoResult.isFailure) {
      return failure(videoResult.error);
    }

    let updatedAudio: AudioSession | null = null;
    let updatedVideo: VideoSession | null = null;

    // Adapt audio quality
    if (audioResult.value) {
      const audioSession = audioResult.value;
      const newBitrate =
        targetQuality === 'low' ? 16 : targetQuality === 'medium' ? 32 : 64;

      const updateResult = await this.audioSessionRepository.updateQualityProfile(
        audioSession.id,
        {
          ...audioSession.qualityProfile,
          bitrateKbps: newBitrate,
        },
      );

      if (updateResult.isFailure) {
        return failure(updateResult.error);
      }
      updatedAudio = updateResult.value;
    }

    // Adapt video quality
    if (videoResult.value) {
      const videoSession = videoResult.value;
      const newResolution =
        targetQuality === 'low'
          ? { width: 320, height: 240, label: '240p' }
          : targetQuality === 'medium'
            ? { width: 640, height: 480, label: '480p' }
            : { width: 1280, height: 720, label: '720p' };

      const newBitrate =
        targetQuality === 'low' ? 150 : targetQuality === 'medium' ? 500 : 1500;

      const updateResult = await this.videoSessionRepository.updateResolutionProfile(
        videoSession.id,
        newResolution,
      );

      if (updateResult.isFailure) {
        return failure(updateResult.error);
      }

      const encodingUpdateResult = await this.videoSessionRepository.updateEncodingProfile(
        videoSession.id,
        {
          ...videoSession.encodingProfile,
          bitrateKbps: newBitrate,
        },
      );

      if (encodingUpdateResult.isFailure) {
        return failure(encodingUpdateResult.error);
      }

      updatedVideo = encodingUpdateResult.value;
    }

    return success({ audio: updatedAudio, video: updatedVideo });
  }
}

// ============================================================================
// CreateOrchestrationSessionUseCase
// ============================================================================

/**
 * Command for CreateOrchestrationSessionUseCase.
 */
export interface CreateOrchestrationSessionCommand {
  readonly mediaSessionId: string;
  readonly policies?: OrchestrationPolicy;
}

/**
 * CreateOrchestrationSessionUseCase — creates an orchestration session.
 *
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
@injectable()
export class CreateOrchestrationSessionUseCase
  implements UseCase<CreateOrchestrationSessionCommand, MediaOrchestrationSession, Error>
{
  constructor(
    @inject(TOKENS.MediaOrchestrationSessionRepository)
    private readonly orchestrationRepository: MediaOrchestrationSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateOrchestrationSessionCommand,
  ): Promise<Result<MediaOrchestrationSession, Error>> {
    const { mediaSessionId, policies } = command;

    const input: CreateOrchestrationSessionInput = {
      mediaSessionId: mediaSessionId as import('../model/media.js').MediaSessionId,
      policies: policies ?? DEFAULT_ORCHESTRATION_POLICY,
    };

    const result = await this.orchestrationRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const session = result.value;

    // Publish MediaOrchestrationStartedEvent
    this.eventBus.publish(
      buildEvent('MediaOrchestrationStarted', '@aimeetx/sdk/media', {
        orchestrationSessionId: session.id,
        mediaSessionId: session.mediaSessionId,
        globalState: session.globalState,
        startedAt: session.createdAt,
      }),
    );

    return success(session);
  }
}

// ============================================================================
// CreatePlatformSessionUseCase
// ============================================================================

/**
 * Command for CreatePlatformSessionUseCase.
 */
export interface CreatePlatformSessionCommand {
  readonly mediaSessionId: string;
  readonly orchestrationSessionId: string;
  readonly sessionType: SessionType;
  readonly policies?: SessionPolicy;
}

/**
 * CreatePlatformSessionUseCase — creates a platform session.
 *
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
@injectable()
export class CreatePlatformSessionUseCase
  implements UseCase<CreatePlatformSessionCommand, MediaPlatformSession, Error>
{
  constructor(
    @inject(TOKENS.MediaPlatformSessionRepository)
    private readonly platformRepository: MediaPlatformSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreatePlatformSessionCommand,
  ): Promise<Result<MediaPlatformSession, Error>> {
    const { mediaSessionId, orchestrationSessionId, sessionType, policies } = command;

    const input: CreatePlatformSessionInput = {
      mediaSessionId: mediaSessionId as import('../model/media.js').MediaSessionId,
      orchestrationSessionId:
        orchestrationSessionId as import('../model/media.js').OrchestrationSessionId,
      sessionType,
      policies: policies ?? DEFAULT_SESSION_POLICY,
    };

    const result = await this.platformRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const session = result.value;

    // Publish MediaPlatformSessionCreatedEvent
    this.eventBus.publish(
      buildEvent('MediaPlatformSessionCreated', '@aimeetx/sdk/media', {
        platformSessionId: session.id,
        mediaSessionId: session.mediaSessionId,
        sessionType: session.sessionType,
        createdAt: session.createdAt,
      }),
    );

    return success(session);
  }
}

// ============================================================================
// RegisterDeviceUseCase
// ============================================================================

/**
 * Command for RegisterDeviceUseCase.
 */
export interface RegisterDeviceCommand {
  readonly input: CreateMediaDeviceInput;
}

/**
 * RegisterDeviceUseCase — registers a new media device.
 *
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
@injectable()
export class RegisterDeviceUseCase
  implements UseCase<RegisterDeviceCommand, MediaDevice, Error>
{
  constructor(
    @inject(TOKENS.MediaDeviceRepository)
    private readonly mediaDeviceRepository: MediaDeviceRepository,
  ) {}

  async execute(command: RegisterDeviceCommand): Promise<Result<MediaDevice, Error>> {
    const result = await this.mediaDeviceRepository.createDevice(command.input);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// GetMediaSessionUseCase
// ============================================================================

/**
 * Command for GetMediaSessionUseCase.
 */
export interface GetMediaSessionCommand {
  readonly sessionId: string;
}

/**
 * GetMediaSessionUseCase — retrieves a media session by ID.
 */
@injectable()
export class GetMediaSessionUseCase
  implements UseCase<GetMediaSessionCommand, MediaSession | null, Error>
{
  constructor(
    @inject(TOKENS.MediaSessionRepository)
    private readonly mediaSessionRepository: MediaSessionRepository,
  ) {}

  async execute(
    command: GetMediaSessionCommand,
  ): Promise<Result<MediaSession | null, Error>> {
    const result = await this.mediaSessionRepository.getSession(
      command.sessionId as import('../model/media.js').MediaSessionId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// CreateNetworkSessionUseCase
// ============================================================================

/**
 * Command for CreateNetworkSessionUseCase.
 */
export interface CreateNetworkSessionCommand {
  readonly mediaSessionId: string;
  readonly routingProfile: 'mesh' | 'sfu' | 'hybrid';
}

/**
 * CreateNetworkSessionUseCase — creates a network session.
 *
 * Per `feature-media/network-layer/SPECIFICATION.md`.
 */
@injectable()
export class CreateNetworkSessionUseCase
  implements UseCase<CreateNetworkSessionCommand, NetworkSession, Error>
{
  constructor(
    @inject(TOKENS.NetworkSessionRepository)
    private readonly networkSessionRepository: NetworkSessionRepository,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(
    command: CreateNetworkSessionCommand,
  ): Promise<Result<NetworkSession, Error>> {
    const { mediaSessionId, routingProfile } = command;

    const input: CreateNetworkSessionInput = {
      mediaSessionId: mediaSessionId as import('../model/media.js').MediaSessionId,
      routingProfile,
    };

    const result = await this.networkSessionRepository.createSession(input);
    if (result.isFailure) {
      return failure(result.error);
    }

    const session = result.value;

    // Publish NetworkSessionCreatedEvent
    this.eventBus.publish(
      buildEvent('NetworkSessionCreated', '@aimeetx/sdk/media', {
        networkSessionId: session.id,
        mediaSessionId: session.mediaSessionId,
        routingProfile: session.routingProfile,
        createdAt: session.createdAt,
      }),
    );

    return success(session);
  }
}