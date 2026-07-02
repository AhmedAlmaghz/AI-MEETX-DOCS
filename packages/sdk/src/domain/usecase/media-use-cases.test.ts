import 'reflect-metadata';

import { describe, expect, it, beforeEach, vi } from 'vitest';
import { container } from 'tsyringe';

import type { IsoDateString, MeetingId, ParticipantId } from '@aimeetx/types';

import { InMemoryEventBus } from '@aimeetx/events';

import type {
  AudioSession,
  AudioSessionId,
  MediaDevice,
  MediaDeviceId,
  MediaSession,
  MediaSessionId,
  NetworkSession,
  NetworkSessionId,
  VideoSession,
  VideoSessionId,
} from '../model/media.js';
import type {
  AudioSessionRepository,
  MediaDeviceRepository,
  MediaSessionRepository,
  NetworkSessionRepository,
  ScreenShareSessionRepository,
  VideoSessionRepository,
} from '../port/media-repository.js';
import {
  ActivateMediaSessionUseCase,
  CloseMediaSessionUseCase,
  CreateMediaSessionUseCase,
  CreateNetworkSessionUseCase,
  DiscoverDevicesUseCase,
  EnableCameraUseCase,
  EnableMicrophoneUseCase,
  GetMediaSessionUseCase,
  SelectDeviceUseCase,
} from './media-use-cases.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const makeMeetingId = (): MeetingId => 'meeting_123' as MeetingId;
const makeParticipantId = (): ParticipantId => 'participant_123' as ParticipantId;
const makeMediaSessionId = (): MediaSessionId => 'media_session_123' as MediaSessionId;
const makeAudioSessionId = (): AudioSessionId => 'audio_session_123' as AudioSessionId;
const makeVideoSessionId = (): VideoSessionId => 'video_session_123' as VideoSessionId;
const makeNetworkSessionId = (): NetworkSessionId => 'network_session_123' as NetworkSessionId;
const makeDeviceId = (): MediaDeviceId => 'device_123' as MediaDeviceId;

const makeMediaSession = (overrides: Partial<MediaSession> = {}): MediaSession => ({
  id: makeMediaSessionId(),
  meetingId: makeMeetingId(),
  participantId: makeParticipantId(),
  state: 'created',
  transportState: 'idle',
  recoveryState: 'none',
  capabilities: {
    supportsAudio: true,
    supportsVideo: true,
    supportsScreenShare: true,
    maxAudioStreams: 1,
    maxVideoStreams: 1,
  },
  createdAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  updatedAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  closedAt: null,
  ...overrides,
});

const makeAudioSession = (overrides: Partial<AudioSession> = {}): AudioSession => ({
  id: makeAudioSessionId(),
  mediaSessionId: makeMediaSessionId(),
  participantId: makeParticipantId(),
  meetingId: makeMeetingId(),
  state: 'created',
  qualityProfile: {
    codec: 'opus',
    sampleRateHz: 48000,
    channels: 1,
    bitrateKbps: 64,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  metrics: {
    latencyMs: 0,
    signalStrength: 100,
    packetLossPercent: 0,
    qualityScore: 100,
  },
  isActive: true,
  createdAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  updatedAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  ...overrides,
});

const makeVideoSession = (overrides: Partial<VideoSession> = {}): VideoSession => ({
  id: makeVideoSessionId(),
  mediaSessionId: makeMediaSessionId(),
  participantId: makeParticipantId(),
  meetingId: makeMeetingId(),
  state: 'created',
  resolutionProfile: { width: 1280, height: 720, label: '720p' },
  frameRateProfile: { fps: 30, label: '30fps' },
  encodingProfile: { codec: 'VP8', bitrateKbps: 1500, keyFrameIntervalMs: 2000 },
  metrics: {
    frameLatencyMs: 0,
    frameDropRate: 0,
    encodingScore: 100,
    qualityScore: 100,
  },
  isActive: true,
  createdAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  updatedAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  ...overrides,
});

const makeNetworkSession = (overrides: Partial<NetworkSession> = {}): NetworkSession => ({
  id: makeNetworkSessionId(),
  mediaSessionId: makeMediaSessionId(),
  participants: [],
  connections: [],
  streamStates: [],
  routingProfile: 'sfu',
  networkMetrics: {
    latencyMs: 0,
    jitterMs: 0,
    packetLossPercent: 0,
    bandwidthKbps: 0,
    quality: 'excellent',
  },
  state: 'created',
  isActive: true,
  createdAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  updatedAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  ...overrides,
});

const makeDevice = (overrides: Partial<MediaDevice> = {}): MediaDevice => ({
  id: makeDeviceId(),
  participantId: makeParticipantId(),
  meetingId: makeMeetingId(),
  type: 'microphone',
  label: 'Microphone',
  state: 'active',
  capabilities: {
    supportedResolutions: [],
    supportedFrameRates: [],
    maxResolution: null,
    hasAutoFocus: false,
    hasAutoExposure: false,
  },
  isSelected: false,
  isAvailable: true,
  lastUpdatedAt: '2026-07-03T00:00:00.000Z' as IsoDateString,
  ...overrides,
});

// ============================================================================
// Tests
// ============================================================================

describe('Media Use Cases', () => {
  let mockMediaSessionRepo: MediaSessionRepository;
  let mockAudioSessionRepo: AudioSessionRepository;
  let mockVideoSessionRepo: VideoSessionRepository;
  let mockNetworkSessionRepo: NetworkSessionRepository;
  let mockScreenShareRepo: ScreenShareSessionRepository;
  let mockDeviceRepo: MediaDeviceRepository;
  let eventBus: InMemoryEventBus;

  beforeEach(() => {
    container.reset();
    eventBus = new InMemoryEventBus();
    container.registerInstance(TOKENS.EventBus, eventBus);

    mockMediaSessionRepo = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getActiveSessionByParticipant: vi.fn(),
      updateSessionState: vi.fn(),
      updateTransportState: vi.fn(),
      updateRecoveryState: vi.fn(),
      closeSession: vi.fn(),
      listActiveSessionsByMeeting: vi.fn(),
    };

    mockAudioSessionRepo = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getActiveSessionByMediaSession: vi.fn(),
      updateSessionState: vi.fn(),
      updateQualityProfile: vi.fn(),
      updateMetrics: vi.fn(),
      closeSession: vi.fn(),
    };

    mockVideoSessionRepo = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getActiveSessionByMediaSession: vi.fn(),
      updateSessionState: vi.fn(),
      updateResolutionProfile: vi.fn(),
      updateFrameRateProfile: vi.fn(),
      updateEncodingProfile: vi.fn(),
      updateMetrics: vi.fn(),
      closeSession: vi.fn(),
    };

    mockNetworkSessionRepo = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getSessionByMediaSession: vi.fn(),
      updateSessionState: vi.fn(),
      updateMetrics: vi.fn(),
      updateRoutingProfile: vi.fn(),
      addPeerConnection: vi.fn(),
      removePeerConnection: vi.fn(),
      closeSession: vi.fn(),
    };

    mockScreenShareRepo = {
      createSession: vi.fn(),
      getSession: vi.fn(),
      getActiveSessionByParticipant: vi.fn(),
      updateSessionState: vi.fn(),
      updateCaptureSource: vi.fn(),
      updateCaptureProfile: vi.fn(),
      updateMetrics: vi.fn(),
      closeSession: vi.fn(),
    };

    mockDeviceRepo = {
      createDevice: vi.fn(),
      getDevice: vi.fn(),
      listDevicesByParticipant: vi.fn(),
      listDevicesByType: vi.fn(),
      getSelectedDeviceByType: vi.fn(),
      selectDevice: vi.fn(),
      deselectDevice: vi.fn(),
      updateDeviceState: vi.fn(),
      updateAvailability: vi.fn(),
      deleteDevice: vi.fn(),
    };

    container.registerInstance(TOKENS.MediaSessionRepository, mockMediaSessionRepo);
    container.registerInstance(TOKENS.AudioSessionRepository, mockAudioSessionRepo);
    container.registerInstance(TOKENS.VideoSessionRepository, mockVideoSessionRepo);
    container.registerInstance(TOKENS.NetworkSessionRepository, mockNetworkSessionRepo);
    container.registerInstance(TOKENS.ScreenShareSessionRepository, mockScreenShareRepo);
    container.registerInstance(TOKENS.MediaDeviceRepository, mockDeviceRepo);
  });

  // ==========================================================================
  // CreateMediaSessionUseCase
  // ==========================================================================

  describe('CreateMediaSessionUseCase', () => {
    it('creates a media session and publishes event', async () => {
      const session = makeMediaSession();
      vi.mocked(mockMediaSessionRepo.getActiveSessionByParticipant).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });
      vi.mocked(mockMediaSessionRepo.createSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      const events: string[] = [];
      eventBus.on('MediaSessionCreated').subscribe(() => events.push('MediaSessionCreated'));

      container.register(TOKENS.CreateMediaSessionUseCase, { useClass: CreateMediaSessionUseCase });
      const useCase = container.resolve<CreateMediaSessionUseCase>(TOKENS.CreateMediaSessionUseCase);

      const result = await useCase.execute({
        input: {
          meetingId: makeMeetingId(),
          participantId: makeParticipantId(),
          capabilities: {
            supportsAudio: true,
            supportsVideo: true,
            supportsScreenShare: true,
            maxAudioStreams: 1,
            maxVideoStreams: 1,
          },
        },
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe(session.id);
      }
      expect(events).toContain('MediaSessionCreated');
    });

    it('returns failure when participant already has active session', async () => {
      const existingSession = makeMediaSession({ state: 'active' });
      vi.mocked(mockMediaSessionRepo.getActiveSessionByParticipant).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: existingSession,
      });

      container.register(TOKENS.CreateMediaSessionUseCase, { useClass: CreateMediaSessionUseCase });
      const useCase = container.resolve<CreateMediaSessionUseCase>(TOKENS.CreateMediaSessionUseCase);

      const result = await useCase.execute({
        input: {
          meetingId: makeMeetingId(),
          participantId: makeParticipantId(),
          capabilities: {
            supportsAudio: true,
            supportsVideo: true,
            supportsScreenShare: true,
            maxAudioStreams: 1,
            maxVideoStreams: 1,
          },
        },
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('already has an active');
      }
    });
  });

  // ==========================================================================
  // ActivateMediaSessionUseCase
  // ==========================================================================

  describe('ActivateMediaSessionUseCase', () => {
    it('activates a media session and publishes event', async () => {
      const session = makeMediaSession({ state: 'created' });
      const activatedSession = makeMediaSession({ state: 'active' });

      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });
      vi.mocked(mockMediaSessionRepo.updateSessionState).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: activatedSession,
      });

      const events: string[] = [];
      eventBus.on('MediaSessionActivated').subscribe(() => events.push('MediaSessionActivated'));

      container.register(TOKENS.ActivateMediaSessionUseCase, {
        useClass: ActivateMediaSessionUseCase,
      });
      const useCase = container.resolve<ActivateMediaSessionUseCase>(
        TOKENS.ActivateMediaSessionUseCase,
      );

      const result = await useCase.execute({ sessionId: session.id });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.state).toBe('active');
      }
      expect(events).toContain('MediaSessionActivated');
    });

    it('returns failure when session is already closed', async () => {
      const session = makeMediaSession({ state: 'closed' });
      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      container.register(TOKENS.ActivateMediaSessionUseCase, {
        useClass: ActivateMediaSessionUseCase,
      });
      const useCase = container.resolve<ActivateMediaSessionUseCase>(
        TOKENS.ActivateMediaSessionUseCase,
      );

      const result = await useCase.execute({ sessionId: session.id });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('closed');
      }
    });
  });

  // ==========================================================================
  // CloseMediaSessionUseCase
  // ==========================================================================

  describe('CloseMediaSessionUseCase', () => {
    it('closes a media session and publishes event', async () => {
      const session = makeMediaSession({ state: 'active' });
      const closedSession = makeMediaSession({
        state: 'closed',
        closedAt: '2026-07-03T00:01:00.000Z' as IsoDateString,
      });

      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });
      vi.mocked(mockMediaSessionRepo.closeSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: closedSession,
      });

      const events: string[] = [];
      eventBus.on('MediaSessionClosed').subscribe(() => events.push('MediaSessionClosed'));

      container.register(TOKENS.CloseMediaSessionUseCase, { useClass: CloseMediaSessionUseCase });
      const useCase = container.resolve<CloseMediaSessionUseCase>(TOKENS.CloseMediaSessionUseCase);

      const result = await useCase.execute({ sessionId: session.id, reason: 'user_left' });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.state).toBe('closed');
      }
      expect(events).toContain('MediaSessionClosed');
    });
  });

  // ==========================================================================
  // EnableMicrophoneUseCase
  // ==========================================================================

  describe('EnableMicrophoneUseCase', () => {
    it('creates an audio session when media session is active', async () => {
      const mediaSession = makeMediaSession({ state: 'active' });
      const audioSession = makeAudioSession();

      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: mediaSession,
      });
      vi.mocked(mockAudioSessionRepo.getActiveSessionByMediaSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });
      vi.mocked(mockAudioSessionRepo.createSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: audioSession,
      });

      const events: string[] = [];
      eventBus.on('AudioSessionCreated').subscribe(() => events.push('AudioSessionCreated'));

      container.register(TOKENS.EnableMicrophoneUseCase, { useClass: EnableMicrophoneUseCase });
      const useCase = container.resolve<EnableMicrophoneUseCase>(TOKENS.EnableMicrophoneUseCase);

      const result = await useCase.execute({
        mediaSessionId: mediaSession.id,
        participantId: makeParticipantId(),
        meetingId: makeMeetingId(),
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe(audioSession.id);
      }
      expect(events).toContain('AudioSessionCreated');
    });

    it('returns failure when media session is not active', async () => {
      const mediaSession = makeMediaSession({ state: 'created' });

      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: mediaSession,
      });

      container.register(TOKENS.EnableMicrophoneUseCase, { useClass: EnableMicrophoneUseCase });
      const useCase = container.resolve<EnableMicrophoneUseCase>(TOKENS.EnableMicrophoneUseCase);

      const result = await useCase.execute({
        mediaSessionId: mediaSession.id,
        participantId: makeParticipantId(),
        meetingId: makeMeetingId(),
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('must be active');
      }
    });
  });

  // ==========================================================================
  // EnableCameraUseCase
  // ==========================================================================

  describe('EnableCameraUseCase', () => {
    it('creates a video session when media session is active', async () => {
      const mediaSession = makeMediaSession({ state: 'active' });
      const videoSession = makeVideoSession();

      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: mediaSession,
      });
      vi.mocked(mockVideoSessionRepo.getActiveSessionByMediaSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });
      vi.mocked(mockVideoSessionRepo.createSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: videoSession,
      });

      const events: string[] = [];
      eventBus.on('VideoSessionCreated').subscribe(() => events.push('VideoSessionCreated'));

      container.register(TOKENS.EnableCameraUseCase, { useClass: EnableCameraUseCase });
      const useCase = container.resolve<EnableCameraUseCase>(TOKENS.EnableCameraUseCase);

      const result = await useCase.execute({
        mediaSessionId: mediaSession.id,
        participantId: makeParticipantId(),
        meetingId: makeMeetingId(),
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.id).toBe(videoSession.id);
      }
      expect(events).toContain('VideoSessionCreated');
    });
  });

  // ==========================================================================
  // CreateNetworkSessionUseCase
  // ==========================================================================

  describe('CreateNetworkSessionUseCase', () => {
    it('creates a network session and publishes event', async () => {
      const networkSession = makeNetworkSession();

      vi.mocked(mockNetworkSessionRepo.createSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: networkSession,
      });

      const events: string[] = [];
      eventBus.on('NetworkSessionCreated').subscribe(() => events.push('NetworkSessionCreated'));

      container.register(TOKENS.CreateNetworkSessionUseCase, {
        useClass: CreateNetworkSessionUseCase,
      });
      const useCase = container.resolve<CreateNetworkSessionUseCase>(
        TOKENS.CreateNetworkSessionUseCase,
      );

      const result = await useCase.execute({
        mediaSessionId: makeMediaSessionId(),
        routingProfile: 'sfu',
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.routingProfile).toBe('sfu');
      }
      expect(events).toContain('NetworkSessionCreated');
    });
  });

  // ==========================================================================
  // GetMediaSessionUseCase
  // ==========================================================================

  describe('GetMediaSessionUseCase', () => {
    it('returns the media session from the repository', async () => {
      const session = makeMediaSession();
      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: session,
      });

      container.register(TOKENS.GetMediaSessionUseCase, { useClass: GetMediaSessionUseCase });
      const useCase = container.resolve<GetMediaSessionUseCase>(TOKENS.GetMediaSessionUseCase);

      const result = await useCase.execute({ sessionId: session.id });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value?.id).toBe(session.id);
      }
    });

    it('returns null when session not found', async () => {
      vi.mocked(mockMediaSessionRepo.getSession).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });

      container.register(TOKENS.GetMediaSessionUseCase, { useClass: GetMediaSessionUseCase });
      const useCase = container.resolve<GetMediaSessionUseCase>(TOKENS.GetMediaSessionUseCase);

      const result = await useCase.execute({ sessionId: 'nonexistent' });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBeNull();
      }
    });
  });

  // ==========================================================================
  // DiscoverDevicesUseCase
  // ==========================================================================

  describe('DiscoverDevicesUseCase', () => {
    it('returns list of devices for participant', async () => {
      const devices = [
        makeDevice({ type: 'microphone', label: 'Microphone 1' }),
        makeDevice({ type: 'microphone', label: 'Microphone 2' }),
        makeDevice({ type: 'camera', label: 'Camera 1' }),
      ];

      vi.mocked(mockDeviceRepo.listDevicesByParticipant).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: devices,
      });

      container.register(TOKENS.DiscoverDevicesUseCase, { useClass: DiscoverDevicesUseCase });
      const useCase = container.resolve<DiscoverDevicesUseCase>(TOKENS.DiscoverDevicesUseCase);

      const result = await useCase.execute({
        participantId: makeParticipantId(),
        meetingId: makeMeetingId(),
      });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(3);
      }
    });
  });

  // ==========================================================================
  // SelectDeviceUseCase
  // ==========================================================================

  describe('SelectDeviceUseCase', () => {
    it('selects a device and publishes event', async () => {
      const device = makeDevice({ state: 'active' });
      const selectedDevice = makeDevice({ state: 'active', isSelected: true });

      vi.mocked(mockDeviceRepo.getDevice).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: device,
      });
      vi.mocked(mockDeviceRepo.getSelectedDeviceByType).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: null,
      });
      vi.mocked(mockDeviceRepo.selectDevice).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: selectedDevice,
      });

      const events: string[] = [];
      eventBus.on('DeviceSelected').subscribe(() => events.push('DeviceSelected'));

      container.register(TOKENS.SelectDeviceUseCase, { useClass: SelectDeviceUseCase });
      const useCase = container.resolve<SelectDeviceUseCase>(TOKENS.SelectDeviceUseCase);

      const result = await useCase.execute({
        deviceId: device.id,
        participantId: makeParticipantId(),
      });

      expect(result.isSuccess).toBe(true);
      expect(events).toContain('DeviceSelected');
    });

    it('returns failure when device is not available', async () => {
      const device = makeDevice({ state: 'unavailable' });

      vi.mocked(mockDeviceRepo.getDevice).mockResolvedValue({
        isSuccess: true,
        isFailure: false,
        value: device,
      });

      container.register(TOKENS.SelectDeviceUseCase, { useClass: SelectDeviceUseCase });
      const useCase = container.resolve<SelectDeviceUseCase>(TOKENS.SelectDeviceUseCase);

      const result = await useCase.execute({
        deviceId: device.id,
        participantId: makeParticipantId(),
      });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('not available');
      }
    });
  });
});