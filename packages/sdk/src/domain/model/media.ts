import type {
  IsoDateString,
  MeetingId,
  ParticipantId,
  UserId,
} from '@aimeetx/types';

// ============================================================================
// Branded ID Types
// ============================================================================

/** Branded media session ID. */
export type MediaSessionId = string & { readonly __brand: 'MediaSessionId' };

/** Branded audio session ID. */
export type AudioSessionId = string & { readonly __brand: 'AudioSessionId' };

/** Branded video session ID. */
export type VideoSessionId = string & { readonly __brand: 'VideoSessionId' };

/** Branded network session ID. */
export type NetworkSessionId = string & { readonly __brand: 'NetworkSessionId' };

/** Branded screen share session ID. */
export type ScreenShareSessionId = string & { readonly __brand: 'ScreenShareSessionId' };

/** Branded orchestration session ID. */
export type OrchestrationSessionId = string & { readonly __brand: 'OrchestrationSessionId' };

/** Branded media platform session ID. */
export type MediaPlatformSessionId = string & { readonly __brand: 'MediaPlatformSessionId' };

/** Branded device ID. */
export type MediaDeviceId = string & { readonly __brand: 'MediaDeviceId' };

/** Branded audio stream ID. */
export type AudioStreamId = string & { readonly __brand: 'AudioStreamId' };

/** Branded frame ID. */
export type FrameId = string & { readonly __brand: 'FrameId' };

/** Branded peer ID. */
export type PeerId = string & { readonly __brand: 'PeerId' };

// ============================================================================
// Media Session States
// ============================================================================

/**
 * Media session state machine.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`:
 * Created → Initializing → Ready → Active → Paused → Recovering → Closed
 */
export type MediaSessionState =
  | 'created'
  | 'initializing'
  | 'ready'
  | 'active'
  | 'paused'
  | 'recovering'
  | 'closed';

/**
 * Transport state for media connectivity.
 */
export type TransportState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed';

/**
 * Recovery state for session recovery tracking.
 */
export type RecoveryState =
  | 'none'
  | 'attempting'
  | 'recovering'
  | 'recovered'
  | 'failed';

// ============================================================================
// Audio States
// ============================================================================

/**
 * Audio session state machine.
 *
 * Per `feature-media/audio-engine/SPECIFICATION.md`:
 * Created → Initializing → Active → Degraded → Recovering → Paused → Closed
 */
export type AudioState =
  | 'created'
  | 'initializing'
  | 'active'
  | 'paused'
  | 'degraded'
  | 'recovering'
  | 'closed';

// ============================================================================
// Video States
// ============================================================================

/**
 * Video session state machine.
 *
 * Per `feature-media/video-engine/SPECIFICATION.md`:
 * Created → Initializing → Active → Degraded → Recovering → Paused → Closed
 */
export type VideoState =
  | 'created'
  | 'initializing'
  | 'active'
  | 'paused'
  | 'degraded'
  | 'recovering'
  | 'closed';

// ============================================================================
// Network States
// ============================================================================

/**
 * Network session connection state machine.
 *
 * Per `feature-media/network-layer/SPECIFICATION.md`:
 * Created → Signaling → Connecting → Connected → Degraded → Reconnecting → Closed
 */
export type NetworkConnectionState =
  | 'created'
  | 'signaling'
  | 'connecting'
  | 'connected'
  | 'degraded'
  | 'reconnecting'
  | 'failed'
  | 'closed';

/**
 * Stream type for network streams.
 */
export type StreamType = 'audio' | 'video' | 'screen_share';

// ============================================================================
// Screen Share States
// ============================================================================

/**
 * Screen share session state machine.
 *
 * Per `feature-media/screen-share/SPECIFICATION.md`:
 * Created → Initializing → Active → Degraded → Recovering → Paused → Closed
 */
export type ScreenShareState =
  | 'created'
  | 'initializing'
  | 'active'
  | 'paused'
  | 'degraded'
  | 'recovering'
  | 'closed';

/**
 * Capture source type for screen share.
 */
export type CaptureSource = 'screen' | 'window' | 'region';

// ============================================================================
// Device Types & States
// ============================================================================

/**
 * Media device type.
 *
 * Per `feature-media/devices/SPECIFICATION.md`: Camera, Microphone, Speaker, ScreenCapture.
 */
export type DeviceType = 'camera' | 'microphone' | 'speaker' | 'screen_capture';

/**
 * Device state.
 */
export type DeviceState =
  | 'active'
  | 'inactive'
  | 'unavailable'
  | 'permission_denied'
  | 'initializing';

// ============================================================================
// Orchestrator States
// ============================================================================

/**
 * Global media orchestration state.
 *
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
export type GlobalMediaState =
  | 'initializing'
  | 'active'
  | 'degraded'
  | 'recovering'
  | 'paused'
  | 'terminating'
  | 'terminated';

// ============================================================================
// Platform Session States
// ============================================================================

/**
 * Media platform session state.
 *
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
export type PlatformSessionState =
  | 'created'
  | 'waiting_for_participants'
  | 'active'
  | 'degraded'
  | 'paused'
  | 'ending'
  | 'ended';

/**
 * Session type for platform sessions.
 */
export type SessionType = 'one_to_one_call' | 'group_call' | 'meeting' | 'webinar';

/**
 * Platform participant role.
 */
export type PlatformParticipantRole = 'host' | 'co_host' | 'participant' | 'viewer';

// ============================================================================
// Network Quality
// ============================================================================

/**
 * Network quality level.
 */
export type MediaNetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

// ============================================================================
// Value Objects
// ============================================================================

/**
 * Audio quality profile.
 *
 * Per `feature-media/audio-engine/SPECIFICATION.md`.
 */
export interface AudioQualityProfile {
  readonly bitrateKbps: number;
  readonly sampleRateHz: number;
  readonly channels: 1 | 2;
  readonly codec: string;
  readonly echoCancellation: boolean;
  readonly noiseSuppression: boolean;
  readonly autoGainControl: boolean;
}

/**
 * Audio metrics.
 */
export interface AudioMetrics {
  readonly latencyMs: number;
  readonly signalStrength: number;
  readonly packetLossPercent: number;
  readonly qualityScore: number;
}

/**
 * Resolution profile for video.
 *
 * Per `feature-media/video-engine/SPECIFICATION.md`.
 */
export interface ResolutionProfile {
  readonly width: number;
  readonly height: number;
  readonly label: string;
}

/**
 * Frame rate profile.
 */
export interface FrameRateProfile {
  readonly fps: number;
  readonly label: string;
}

/**
 * Encoding profile.
 */
export interface EncodingProfile {
  readonly codec: string;
  readonly bitrateKbps: number;
  readonly keyFrameIntervalMs: number;
}

/**
 * Video metrics.
 */
export interface VideoMetrics {
  readonly frameLatencyMs: number;
  readonly frameDropRate: number;
  readonly encodingScore: number;
  readonly qualityScore: number;
}

/**
 * Stream descriptor for network layer.
 *
 * Per `feature-media/network-layer/SPECIFICATION.md`.
 */
export interface StreamDescriptor {
  readonly streamType: StreamType;
  readonly codec: string;
  readonly bitrateKbps: number;
  readonly resolution: ResolutionProfile | null;
  readonly fps: number | null;
  readonly active: boolean;
}

/**
 * Network metrics.
 */
export interface NetworkMetrics {
  readonly latencyMs: number;
  readonly jitterMs: number;
  readonly packetLossPercent: number;
  readonly bandwidthKbps: number;
  readonly quality: MediaNetworkQuality;
}

/**
 * Routing profile.
 */
export type RoutingProfile = 'mesh' | 'sfu' | 'hybrid';

/**
 * Screen capture profile.
 *
 * Per `feature-media/screen-share/SPECIFICATION.md`.
 */
export interface CaptureProfile {
  readonly source: CaptureSource;
  readonly resolution: ResolutionProfile;
  readonly fps: number;
  readonly region: CaptureRegion | null;
}

/**
 * Capture region for region-based screen share.
 */
export interface CaptureRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Screen metrics.
 */
export interface ScreenMetrics {
  readonly captureLatencyMs: number;
  readonly frameDiffRatio: number;
  readonly fps: number;
  readonly cpuUsagePercent: number;
  readonly bandwidthEstimateKbps: number;
}

/**
 * Device capabilities.
 *
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
export interface DeviceCapabilities {
  readonly supportedResolutions: ReadonlyArray<ResolutionProfile>;
  readonly supportedFrameRates: ReadonlyArray<number>;
  readonly maxResolution: ResolutionProfile | null;
  readonly hasAutoFocus: boolean;
  readonly hasAutoExposure: boolean;
}

/**
 * Session capabilities for media session.
 */
export interface SessionCapabilities {
  readonly supportsAudio: boolean;
  readonly supportsVideo: boolean;
  readonly supportsScreenShare: boolean;
  readonly maxAudioStreams: number;
  readonly maxVideoStreams: number;
}

/**
 * Subsystem health snapshot for orchestrator.
 *
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
export interface SubsystemHealthSnapshot {
  readonly status: 'healthy' | 'degraded' | 'failed';
  readonly latencyImpact: number;
  readonly errorRate: number;
  readonly degradationLevel: number;
}

/**
 * Orchestration policy.
 */
export interface OrchestrationPolicy {
  readonly maxAudioStreams: number;
  readonly maxVideoStreams: number;
  readonly allowScreenShare: boolean;
  readonly autoDegradeOnNetworkLoss: boolean;
  readonly recoveryModeEnabled: boolean;
  readonly priorityStreams: ReadonlyArray<StreamType>;
}

/**
 * Session policy for platform session.
 *
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
export interface SessionPolicy {
  readonly maxParticipants: number;
  readonly allowScreenShare: boolean;
  readonly recordingEnabled: boolean;
  readonly autoMuteOnJoin: boolean;
  readonly videoDefaultState: 'on' | 'off';
  readonly networkAdaptationMode: 'aggressive' | 'moderate' | 'conservative';
}

/**
 * Participant profile for platform session.
 */
export interface ParticipantProfile {
  readonly participantId: ParticipantId;
  readonly userId: UserId;
  readonly displayName: string;
  readonly role: PlatformParticipantRole;
  readonly connectedAt: IsoDateString;
}

// ============================================================================
// Constraints
// ============================================================================

/**
 * Media system constraints.
 */
export const MEDIA_CONSTRAINTS = {
  /** Maximum participants in a single media session. */
  MAX_PARTICIPANTS: 500,
  /** Maximum audio streams per session. */
  MAX_AUDIO_STREAMS: 500,
  /** Maximum video streams per session. */
  MAX_VIDEO_STREAMS: 50,
  /** Maximum screen share sessions per participant. */
  MAX_SCREEN_SHARES_PER_PARTICIPANT: 1,
  /** Maximum devices per type per participant. */
  MAX_DEVICES_PER_TYPE: 1,
  /** Audio processing latency target in ms. */
  AUDIO_LATENCY_TARGET_MS: 150,
  /** Video frame latency target in ms. */
  VIDEO_LATENCY_TARGET_MS: 200,
  /** Signaling latency target in ms. */
  SIGNALING_LATENCY_TARGET_MS: 100,
  /** Connection establishment target in ms. */
  CONNECTION_ESTABLISHMENT_TARGET_MS: 2000,
  /** Reconnection time target in ms. */
  RECONNECTION_TARGET_MS: 3000,
  /** Quality adaptation response target in ms. */
  QUALITY_ADAPTATION_TARGET_MS: 300,
  /** Minimum resolution width. */
  MIN_RESOLUTION_WIDTH: 160,
  /** Minimum resolution height. */
  MIN_RESOLUTION_HEIGHT: 120,
  /** Maximum resolution width. */
  MAX_RESOLUTION_WIDTH: 3840,
  /** Maximum resolution height. */
  MAX_RESOLUTION_HEIGHT: 2160,
  /** Minimum frame rate. */
  MIN_FPS: 1,
  /** Maximum frame rate. */
  MAX_FPS: 60,
  /** Minimum audio bitrate in kbps. */
  MIN_AUDIO_BITRATE_KBPS: 8,
  /** Maximum audio bitrate in kbps. */
  MAX_AUDIO_BITRATE_KBPS: 510,
  /** Minimum video bitrate in kbps. */
  MIN_VIDEO_BITRATE_KBPS: 50,
  /** Maximum video bitrate in kbps. */
  MAX_VIDEO_BITRATE_KBPS: 6000,
} as const;

// ============================================================================
// Default Profiles
// ============================================================================

/**
 * Default audio quality profile.
 */
export const DEFAULT_AUDIO_QUALITY: AudioQualityProfile = {
  bitrateKbps: 64,
  sampleRateHz: 48000,
  channels: 1,
  codec: 'opus',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

/**
 * Default video resolution profile.
 */
export const DEFAULT_VIDEO_RESOLUTION: ResolutionProfile = {
  width: 1280,
  height: 720,
  label: '720p',
};

/**
 * Default video frame rate profile.
 */
export const DEFAULT_VIDEO_FRAME_RATE: FrameRateProfile = {
  fps: 30,
  label: '30fps',
};

/**
 * Default video encoding profile.
 */
export const DEFAULT_VIDEO_ENCODING: EncodingProfile = {
  codec: 'VP8',
  bitrateKbps: 1500,
  keyFrameIntervalMs: 2000,
};

/**
 * Default orchestration policy.
 */
export const DEFAULT_ORCHESTRATION_POLICY: OrchestrationPolicy = {
  maxAudioStreams: 500,
  maxVideoStreams: 50,
  allowScreenShare: true,
  autoDegradeOnNetworkLoss: true,
  recoveryModeEnabled: true,
  priorityStreams: ['audio', 'video', 'screen_share'],
};

/**
 * Default session policy.
 */
export const DEFAULT_SESSION_POLICY: SessionPolicy = {
  maxParticipants: 100,
  allowScreenShare: true,
  recordingEnabled: false,
  autoMuteOnJoin: false,
  videoDefaultState: 'on',
  networkAdaptationMode: 'moderate',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a media session state is terminal.
 */
export function isMediaSessionTerminal(state: MediaSessionState): boolean {
  return state === 'closed';
}

/**
 * Check if a media session state is active.
 */
export function isMediaSessionActive(state: MediaSessionState): boolean {
  return state === 'active';
}

/**
 * Check if an audio state is terminal.
 */
export function isAudioTerminal(state: AudioState): boolean {
  return state === 'closed';
}

/**
 * Check if a video state is terminal.
 */
export function isVideoTerminal(state: VideoState): boolean {
  return state === 'closed';
}

/**
 * Check if a network connection state is terminal.
 */
export function isNetworkTerminal(state: NetworkConnectionState): boolean {
  return state === 'closed' || state === 'failed';
}

/**
 * Check if a network connection state is connected.
 */
export function isNetworkConnected(state: NetworkConnectionState): boolean {
  return state === 'connected';
}

/**
 * Check if a screen share state is terminal.
 */
export function isScreenShareTerminal(state: ScreenShareState): boolean {
  return state === 'closed';
}

/**
 * Check if a device state allows selection.
 */
export function isDeviceSelectable(state: DeviceState): boolean {
  return state === 'active' || state === 'inactive';
}

/**
 * Check if a global media state is terminal.
 */
export function isGlobalMediaTerminal(state: GlobalMediaState): boolean {
  return state === 'terminated';
}

/**
 * Check if a platform session state is terminal.
 */
export function isPlatformSessionTerminal(state: PlatformSessionState): boolean {
  return state === 'ended';
}

/**
 * Check if a platform participant role has host privileges.
 */
export function isPlatformHost(role: PlatformParticipantRole): boolean {
  return role === 'host';
}

/**
 * Check if a platform participant role can manage others.
 */
export function canPlatformManage(role: PlatformParticipantRole): boolean {
  return role === 'host' || role === 'co_host';
}

// ============================================================================
// Aggregate Root Entities
// ============================================================================

/**
 * MediaSession — aggregate root for media connectivity lifecycle.
 *
 * Per `feature-media/media-session/SPECIFICATION.md`.
 */
export interface MediaSession {
  readonly id: MediaSessionId;
  readonly meetingId: MeetingId;
  readonly participantId: ParticipantId;
  readonly state: MediaSessionState;
  readonly transportState: TransportState;
  readonly recoveryState: RecoveryState;
  readonly capabilities: SessionCapabilities;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
  readonly closedAt: IsoDateString | null;
}

/**
 * AudioSession — aggregate root for audio processing lifecycle.
 *
 * Per `feature-media/audio-engine/SPECIFICATION.md`.
 */
export interface AudioSession {
  readonly id: AudioSessionId;
  readonly mediaSessionId: MediaSessionId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly state: AudioState;
  readonly qualityProfile: AudioQualityProfile;
  readonly metrics: AudioMetrics;
  readonly isActive: boolean;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * VideoSession — aggregate root for video processing lifecycle.
 *
 * Per `feature-media/video-engine/SPECIFICATION.md`.
 */
export interface VideoSession {
  readonly id: VideoSessionId;
  readonly mediaSessionId: MediaSessionId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly state: VideoState;
  readonly resolutionProfile: ResolutionProfile;
  readonly frameRateProfile: FrameRateProfile;
  readonly encodingProfile: EncodingProfile;
  readonly metrics: VideoMetrics;
  readonly isActive: boolean;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * NetworkSession — aggregate root for network transport lifecycle.
 *
 * Per `feature-media/network-layer/SPECIFICATION.md`.
 */
export interface NetworkSession {
  readonly id: NetworkSessionId;
  readonly mediaSessionId: MediaSessionId;
  readonly participants: ReadonlyArray<PeerId>;
  readonly connections: ReadonlyArray<PeerConnectionState>;
  readonly streamStates: ReadonlyArray<StreamDescriptor>;
  readonly routingProfile: RoutingProfile;
  readonly networkMetrics: NetworkMetrics;
  readonly state: NetworkConnectionState;
  readonly isActive: boolean;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * Peer connection state within a network session.
 */
export interface PeerConnectionState {
  readonly peerId: PeerId;
  readonly state: NetworkConnectionState;
  readonly streams: ReadonlyArray<StreamDescriptor>;
  readonly connectedAt: IsoDateString | null;
}

/**
 * ScreenShareSession — aggregate root for screen sharing lifecycle.
 *
 * Per `feature-media/screen-share/SPECIFICATION.md`.
 */
export interface ScreenShareSession {
  readonly id: ScreenShareSessionId;
  readonly mediaSessionId: MediaSessionId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly state: ScreenShareState;
  readonly captureSource: CaptureSource;
  readonly captureProfile: CaptureProfile;
  readonly metrics: ScreenMetrics;
  readonly isActive: boolean;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * MediaDevice — aggregate root for device management.
 *
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
export interface MediaDevice {
  readonly id: MediaDeviceId;
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly type: DeviceType;
  readonly label: string;
  readonly state: DeviceState;
  readonly isSelected: boolean;
  readonly capabilities: DeviceCapabilities;
  readonly isAvailable: boolean;
  readonly lastUpdatedAt: IsoDateString;
}

/**
 * MediaOrchestrationSession — aggregate root for cross-subsystem coordination.
 *
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
export interface MediaOrchestrationSession {
  readonly id: OrchestrationSessionId;
  readonly mediaSessionId: MediaSessionId;
  readonly globalState: GlobalMediaState;
  readonly subsystemStates: SubsystemStates;
  readonly activePolicies: OrchestrationPolicy;
  readonly healthSnapshot: SubsystemHealthSnapshot;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}

/**
 * Subsystem states within orchestration.
 */
export interface SubsystemStates {
  readonly audioState: AudioState;
  readonly videoState: VideoState;
  readonly screenState: ScreenShareState;
  readonly networkState: NetworkConnectionState;
}

/**
 * MediaPlatformSession — aggregate root for user-facing session experience.
 *
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
export interface MediaPlatformSession {
  readonly id: MediaPlatformSessionId;
  readonly mediaSessionId: MediaSessionId;
  readonly orchestrationSessionId: OrchestrationSessionId;
  readonly sessionType: SessionType;
  readonly state: PlatformSessionState;
  readonly participants: ReadonlyArray<ParticipantProfile>;
  readonly activePolicies: SessionPolicy;
  readonly createdAt: IsoDateString;
  readonly updatedAt: IsoDateString;
}