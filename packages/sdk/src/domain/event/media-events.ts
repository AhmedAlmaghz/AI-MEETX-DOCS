import type { DomainEvent, IsoDateString, MeetingId, ParticipantId } from '@aimeetx/types';

import type {
  AudioSessionId,
  AudioState,
  CaptureSource,
  DeviceState,
  DeviceType,
  GlobalMediaState,
  MediaDeviceId,
  MediaNetworkQuality,
  MediaPlatformSessionId,
  MediaSessionId,
  NetworkSessionId,
  OrchestrationSessionId,
  PlatformParticipantRole,
  ScreenShareSessionId,
  ScreenShareState,
  SessionType,
  VideoSessionId,
  VideoState,
} from '../model/media.js';

// ============================================================================
// Media Session Events
// ============================================================================

/**
 * MediaSessionCreatedEvent — published when a media session is created.
 * Per `feature-media/media-session/SPECIFICATION.md`.
 */
export interface MediaSessionCreatedEvent extends DomainEvent {
  readonly eventType: 'MediaSessionCreated';
  readonly payload: {
    readonly sessionId: MediaSessionId;
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly createdAt: IsoDateString;
  };
}

/**
 * MediaSessionReadyEvent — published when session is ready to activate.
 */
export interface MediaSessionReadyEvent extends DomainEvent {
  readonly eventType: 'MediaSessionReady';
  readonly payload: {
    readonly sessionId: MediaSessionId;
    readonly readyAt: IsoDateString;
  };
}

/**
 * MediaSessionActivatedEvent — published when session becomes active.
 * Consumed by: audio-engine, video-engine, screen-share, network-layer.
 */
export interface MediaSessionActivatedEvent extends DomainEvent {
  readonly eventType: 'MediaSessionActivated';
  readonly payload: {
    readonly sessionId: MediaSessionId;
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly activatedAt: IsoDateString;
  };
}

/**
 * MediaSessionPausedEvent — published when session is paused.
 */
export interface MediaSessionPausedEvent extends DomainEvent {
  readonly eventType: 'MediaSessionPaused';
  readonly payload: {
    readonly sessionId: MediaSessionId;
    readonly pausedAt: IsoDateString;
  };
}

/**
 * MediaSessionRecoveredEvent — published when session recovers.
 */
export interface MediaSessionRecoveredEvent extends DomainEvent {
  readonly eventType: 'MediaSessionRecovered';
  readonly payload: {
    readonly sessionId: MediaSessionId;
    readonly recoveredAt: IsoDateString;
  };
}

/**
 * MediaSessionClosedEvent — published when session is closed.
 * Consumed by: all media subdomains.
 */
export interface MediaSessionClosedEvent extends DomainEvent {
  readonly eventType: 'MediaSessionClosed';
  readonly payload: {
    readonly sessionId: MediaSessionId;
    readonly meetingId: MeetingId;
    readonly participantId: ParticipantId;
    readonly closedAt: IsoDateString;
    readonly reason: 'user_left' | 'meeting_ended' | 'error' | 'timeout';
  };
}

// ============================================================================
// Audio Engine Events
// ============================================================================

/**
 * AudioSessionCreatedEvent — published when audio session is created.
 * Per `feature-media/audio-engine/SPECIFICATION.md`.
 */
export interface AudioSessionCreatedEvent extends DomainEvent {
  readonly eventType: 'AudioSessionCreated';
  readonly payload: {
    readonly audioSessionId: AudioSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly participantId: ParticipantId;
    readonly meetingId: MeetingId;
    readonly createdAt: IsoDateString;
  };
}

/**
 * AudioProcessingStartedEvent — published when audio processing begins.
 */
export interface AudioProcessingStartedEvent extends DomainEvent {
  readonly eventType: 'AudioProcessingStarted';
  readonly payload: {
    readonly audioSessionId: AudioSessionId;
    readonly startedAt: IsoDateString;
  };
}

/**
 * AudioQualityDegradedEvent — published when audio quality degrades.
 * Consumed by: media-orchestrator, network-layer.
 */
export interface AudioQualityDegradedEvent extends DomainEvent {
  readonly eventType: 'AudioQualityDegraded';
  readonly payload: {
    readonly audioSessionId: AudioSessionId;
    readonly previousState: AudioState;
    readonly currentState: AudioState;
    readonly qualityScore: number;
    readonly packetLossPercent: number;
    readonly degradedAt: IsoDateString;
  };
}

/**
 * AudioRecoveredEvent — published when audio recovers.
 */
export interface AudioRecoveredEvent extends DomainEvent {
  readonly eventType: 'AudioRecovered';
  readonly payload: {
    readonly audioSessionId: AudioSessionId;
    readonly recoveredAt: IsoDateString;
  };
}

/**
 * AudioSessionClosedEvent — published when audio session closes.
 */
export interface AudioSessionClosedEvent extends DomainEvent {
  readonly eventType: 'AudioSessionClosed';
  readonly payload: {
    readonly audioSessionId: AudioSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly closedAt: IsoDateString;
  };
}

/**
 * AudioMetricsUpdatedEvent — published when audio metrics update.
 */
export interface AudioMetricsUpdatedEvent extends DomainEvent {
  readonly eventType: 'AudioMetricsUpdated';
  readonly payload: {
    readonly audioSessionId: AudioSessionId;
    readonly latencyMs: number;
    readonly signalStrength: number;
    readonly packetLossPercent: number;
    readonly qualityScore: number;
    readonly updatedAt: IsoDateString;
  };
}

// ============================================================================
// Video Engine Events
// ============================================================================

/**
 * VideoSessionCreatedEvent — published when video session is created.
 * Per `feature-media/video-engine/SPECIFICATION.md`.
 */
export interface VideoSessionCreatedEvent extends DomainEvent {
  readonly eventType: 'VideoSessionCreated';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly participantId: ParticipantId;
    readonly meetingId: MeetingId;
    readonly createdAt: IsoDateString;
  };
}

/**
 * VideoProcessingStartedEvent — published when video processing begins.
 */
export interface VideoProcessingStartedEvent extends DomainEvent {
  readonly eventType: 'VideoProcessingStarted';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly startedAt: IsoDateString;
  };
}

/**
 * VideoResolutionChangedEvent — published when resolution changes.
 */
export interface VideoResolutionChangedEvent extends DomainEvent {
  readonly eventType: 'VideoResolutionChanged';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly previousWidth: number;
    readonly previousHeight: number;
    readonly newWidth: number;
    readonly newHeight: number;
    readonly changedAt: IsoDateString;
  };
}

/**
 * VideoFrameRateChangedEvent — published when frame rate changes.
 */
export interface VideoFrameRateChangedEvent extends DomainEvent {
  readonly eventType: 'VideoFrameRateChanged';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly previousFps: number;
    readonly newFps: number;
    readonly changedAt: IsoDateString;
  };
}

/**
 * VideoQualityDegradedEvent — published when video quality degrades.
 * Consumed by: media-orchestrator, network-layer.
 */
export interface VideoQualityDegradedEvent extends DomainEvent {
  readonly eventType: 'VideoQualityDegraded';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly previousState: VideoState;
    readonly currentState: VideoState;
    readonly qualityScore: number;
    readonly frameDropRate: number;
    readonly degradedAt: IsoDateString;
  };
}

/**
 * VideoRecoveredEvent — published when video recovers.
 */
export interface VideoRecoveredEvent extends DomainEvent {
  readonly eventType: 'VideoRecovered';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly recoveredAt: IsoDateString;
  };
}

/**
 * VideoMetricsUpdatedEvent — published when video metrics update.
 */
export interface VideoMetricsUpdatedEvent extends DomainEvent {
  readonly eventType: 'VideoMetricsUpdated';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly frameLatencyMs: number;
    readonly frameDropRate: number;
    readonly encodingScore: number;
    readonly qualityScore: number;
    readonly updatedAt: IsoDateString;
  };
}

/**
 * VideoSessionClosedEvent — published when video session closes.
 */
export interface VideoSessionClosedEvent extends DomainEvent {
  readonly eventType: 'VideoSessionClosed';
  readonly payload: {
    readonly videoSessionId: VideoSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly closedAt: IsoDateString;
  };
}

// ============================================================================
// Network Layer Events
// ============================================================================

/**
 * NetworkSessionCreatedEvent — published when network session is created.
 * Per `feature-media/network-layer/SPECIFICATION.md`.
 */
export interface NetworkSessionCreatedEvent extends DomainEvent {
  readonly eventType: 'NetworkSessionCreated';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly routingProfile: string;
    readonly createdAt: IsoDateString;
  };
}

/**
 * PeerConnectionEstablishedEvent — published when peer connection is established.
 */
export interface PeerConnectionEstablishedEvent extends DomainEvent {
  readonly eventType: 'PeerConnectionEstablished';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly peerId: string;
    readonly establishedAt: IsoDateString;
  };
}

/**
 * StreamNegotiationCompletedEvent — published when stream negotiation completes.
 */
export interface StreamNegotiationCompletedEvent extends DomainEvent {
  readonly eventType: 'StreamNegotiationCompleted';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly peerId: string;
    readonly streamTypes: ReadonlyArray<string>;
    readonly completedAt: IsoDateString;
  };
}

/**
 * MediaNetworkQualityDegradedEvent — published when media network quality degrades.
 * Consumed by: audio-engine, video-engine, media-orchestrator.
 */
export interface MediaNetworkQualityDegradedEvent extends DomainEvent {
  readonly eventType: 'MediaNetworkQualityDegraded';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly previousQuality: MediaNetworkQuality;
    readonly currentQuality: MediaNetworkQuality;
    readonly latencyMs: number;
    readonly packetLossPercent: number;
    readonly degradedAt: IsoDateString;
  };
}

/**
 * NetworkRecoveredEvent — published when network recovers.
 */
export interface NetworkRecoveredEvent extends DomainEvent {
  readonly eventType: 'NetworkRecovered';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly quality: MediaNetworkQuality;
    readonly recoveredAt: IsoDateString;
  };
}

/**
 * PeerDisconnectedEvent — published when a peer disconnects.
 */
export interface PeerDisconnectedEvent extends DomainEvent {
  readonly eventType: 'PeerDisconnected';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly peerId: string;
    readonly reason: 'voluntary' | 'network_failure' | 'timeout';
    readonly disconnectedAt: IsoDateString;
  };
}

/**
 * PeerReconnectedEvent — published when a peer reconnects.
 */
export interface PeerReconnectedEvent extends DomainEvent {
  readonly eventType: 'PeerReconnected';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly peerId: string;
    readonly reconnectedAt: IsoDateString;
  };
}

/**
 * RoutingChangedEvent — published when routing profile changes.
 */
export interface RoutingChangedEvent extends DomainEvent {
  readonly eventType: 'RoutingChanged';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly previousProfile: string;
    readonly newProfile: string;
    readonly changedAt: IsoDateString;
  };
}

/**
 * NetworkSessionClosedEvent — published when network session closes.
 */
export interface NetworkSessionClosedEvent extends DomainEvent {
  readonly eventType: 'NetworkSessionClosed';
  readonly payload: {
    readonly networkSessionId: NetworkSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly closedAt: IsoDateString;
  };
}

// ============================================================================
// Screen Share Events
// ============================================================================

/**
 * ScreenShareSessionCreatedEvent — published when screen share session is created.
 * Per `feature-media/screen-share/SPECIFICATION.md`.
 */
export interface ScreenShareSessionCreatedEvent extends DomainEvent {
  readonly eventType: 'ScreenShareSessionCreated';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly participantId: ParticipantId;
    readonly meetingId: MeetingId;
    readonly captureSource: CaptureSource;
    readonly createdAt: IsoDateString;
  };
}

/**
 * ScreenCaptureStartedEvent — published when screen capture starts.
 */
export interface ScreenCaptureStartedEvent extends DomainEvent {
  readonly eventType: 'ScreenCaptureStarted';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly captureSource: CaptureSource;
    readonly startedAt: IsoDateString;
  };
}

/**
 * ScreenSourceChangedEvent — published when capture source changes.
 */
export interface ScreenSourceChangedEvent extends DomainEvent {
  readonly eventType: 'ScreenSourceChanged';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly previousSource: CaptureSource;
    readonly newSource: CaptureSource;
    readonly changedAt: IsoDateString;
  };
}

/**
 * ScreenRegionUpdatedEvent — published when capture region changes.
 */
export interface ScreenRegionUpdatedEvent extends DomainEvent {
  readonly eventType: 'ScreenRegionUpdated';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
    readonly updatedAt: IsoDateString;
  };
}

/**
 * ScreenQualityDegradedEvent — published when screen share quality degrades.
 */
export interface ScreenQualityDegradedEvent extends DomainEvent {
  readonly eventType: 'ScreenQualityDegraded';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly previousState: ScreenShareState;
    readonly currentState: ScreenShareState;
    readonly cpuUsagePercent: number;
    readonly degradedAt: IsoDateString;
  };
}

/**
 * ScreenRecoveredEvent — published when screen share recovers.
 */
export interface ScreenRecoveredEvent extends DomainEvent {
  readonly eventType: 'ScreenRecovered';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly recoveredAt: IsoDateString;
  };
}

/**
 * ScreenMetricsUpdatedEvent — published when screen metrics update.
 */
export interface ScreenMetricsUpdatedEvent extends DomainEvent {
  readonly eventType: 'ScreenMetricsUpdated';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly captureLatencyMs: number;
    readonly frameDiffRatio: number;
    readonly fps: number;
    readonly cpuUsagePercent: number;
    readonly updatedAt: IsoDateString;
  };
}

/**
 * ScreenShareSessionClosedEvent — published when screen share session closes.
 */
export interface ScreenShareSessionClosedEvent extends DomainEvent {
  readonly eventType: 'ScreenShareSessionClosed';
  readonly payload: {
    readonly screenShareSessionId: ScreenShareSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly closedAt: IsoDateString;
  };
}

// ============================================================================
// Device Events
// ============================================================================

/**
 * DeviceSelectedEvent — published when a device is selected.
 * Consumed by: audio-engine, video-engine.
 * Per `feature-media/devices/SPECIFICATION.md`.
 */
export interface DeviceSelectedEvent extends DomainEvent {
  readonly eventType: 'DeviceSelected';
  readonly payload: {
    readonly deviceId: MediaDeviceId;
    readonly participantId: ParticipantId;
    readonly meetingId: MeetingId;
    readonly deviceType: DeviceType;
    readonly label: string;
    readonly selectedAt: IsoDateString;
  };
}

/**
 * DeviceChangedEvent — published when device state changes.
 */
export interface DeviceChangedEvent extends DomainEvent {
  readonly eventType: 'DeviceChanged';
  readonly payload: {
    readonly deviceId: MediaDeviceId;
    readonly participantId: ParticipantId;
    readonly deviceType: DeviceType;
    readonly previousState: DeviceState;
    readonly newState: DeviceState;
    readonly changedAt: IsoDateString;
  };
}

/**
 * DeviceUnavailableEvent — published when a device becomes unavailable.
 * Consumed by: audio-engine, video-engine.
 */
export interface DeviceUnavailableEvent extends DomainEvent {
  readonly eventType: 'DeviceUnavailable';
  readonly payload: {
    readonly deviceId: MediaDeviceId;
    readonly participantId: ParticipantId;
    readonly deviceType: DeviceType;
    readonly unavailableAt: IsoDateString;
  };
}

/**
 * DevicePermissionDeniedEvent — published when device permission is denied.
 */
export interface DevicePermissionDeniedEvent extends DomainEvent {
  readonly eventType: 'DevicePermissionDenied';
  readonly payload: {
    readonly deviceId: MediaDeviceId;
    readonly participantId: ParticipantId;
    readonly deviceType: DeviceType;
    readonly deniedAt: IsoDateString;
  };
}

/**
 * DeviceRecoveredEvent — published when a device recovers.
 */
export interface DeviceRecoveredEvent extends DomainEvent {
  readonly eventType: 'DeviceRecovered';
  readonly payload: {
    readonly deviceId: MediaDeviceId;
    readonly participantId: ParticipantId;
    readonly deviceType: DeviceType;
    readonly recoveredAt: IsoDateString;
  };
}

// ============================================================================
// Media Orchestrator Events
// ============================================================================

/**
 * MediaOrchestrationStartedEvent — published when orchestration begins.
 * Per `feature-media/media-orchestrator/SPECIFICATION.md`.
 */
export interface MediaOrchestrationStartedEvent extends DomainEvent {
  readonly eventType: 'MediaOrchestrationStarted';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly globalState: GlobalMediaState;
    readonly startedAt: IsoDateString;
  };
}

/**
 * MediaGlobalStateChangedEvent — published when global state changes.
 */
export interface MediaGlobalStateChangedEvent extends DomainEvent {
  readonly eventType: 'MediaGlobalStateChanged';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly previousState: GlobalMediaState;
    readonly newState: GlobalMediaState;
    readonly changedAt: IsoDateString;
  };
}

/**
 * SubsystemCoordinationEvent — published when orchestrator coordinates subsystems.
 */
export interface SubsystemCoordinationEvent extends DomainEvent {
  readonly eventType: 'SubsystemCoordination';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly decision: string;
    readonly targetSubsystem: string;
    readonly coordinatedAt: IsoDateString;
  };
}

/**
 * QualityPolicyAppliedEvent — published when quality policy is applied.
 */
export interface QualityPolicyAppliedEvent extends DomainEvent {
  readonly eventType: 'QualityPolicyApplied';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly policyName: string;
    readonly appliedAt: IsoDateString;
  };
}

/**
 * RecoveryInitiatedEvent — published when recovery is initiated.
 */
export interface RecoveryInitiatedEvent extends DomainEvent {
  readonly eventType: 'RecoveryInitiated';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly affectedSubsystems: ReadonlyArray<string>;
    readonly initiatedAt: IsoDateString;
  };
}

/**
 * RecoveryCompletedEvent — published when recovery completes.
 */
export interface RecoveryCompletedEvent extends DomainEvent {
  readonly eventType: 'RecoveryCompleted';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly completedAt: IsoDateString;
  };
}

/**
 * MediaOrchestrationStoppedEvent — published when orchestration stops.
 */
export interface MediaOrchestrationStoppedEvent extends DomainEvent {
  readonly eventType: 'MediaOrchestrationStopped';
  readonly payload: {
    readonly orchestrationSessionId: OrchestrationSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly stoppedAt: IsoDateString;
  };
}

// ============================================================================
// Media Platform Events
// ============================================================================

/**
 * MediaPlatformSessionCreatedEvent — published when platform session is created.
 * Per `feature-media/media-platform/SPECIFICATION.md`.
 */
export interface MediaPlatformSessionCreatedEvent extends DomainEvent {
  readonly eventType: 'MediaPlatformSessionCreated';
  readonly payload: {
    readonly platformSessionId: MediaPlatformSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly sessionType: SessionType;
    readonly createdAt: IsoDateString;
  };
}

/**
 * MediaPlatformSessionStateChangedEvent — published when platform session state changes.
 */
export interface MediaPlatformSessionStateChangedEvent extends DomainEvent {
  readonly eventType: 'MediaPlatformSessionStateChanged';
  readonly payload: {
    readonly platformSessionId: MediaPlatformSessionId;
    readonly previousState: string;
    readonly newState: string;
    readonly changedAt: IsoDateString;
  };
}

/**
 * ParticipantRoleUpdatedEvent — published when participant role changes.
 */
export interface ParticipantRoleUpdatedEvent extends DomainEvent {
  readonly eventType: 'ParticipantRoleUpdated';
  readonly payload: {
    readonly platformSessionId: MediaPlatformSessionId;
    readonly participantId: ParticipantId;
    readonly previousRole: PlatformParticipantRole;
    readonly newRole: PlatformParticipantRole;
    readonly updatedBy: ParticipantId;
    readonly updatedAt: IsoDateString;
  };
}

/**
 * SessionPolicyAppliedEvent — published when session policy is applied.
 */
export interface SessionPolicyAppliedEvent extends DomainEvent {
  readonly eventType: 'SessionPolicyApplied';
  readonly payload: {
    readonly platformSessionId: MediaPlatformSessionId;
    readonly policyChanges: ReadonlyArray<string>;
    readonly appliedBy: ParticipantId;
    readonly appliedAt: IsoDateString;
  };
}

/**
 * MediaPlatformSessionEndedEvent — published when platform session ends.
 */
export interface MediaPlatformSessionEndedEvent extends DomainEvent {
  readonly eventType: 'MediaPlatformSessionEnded';
  readonly payload: {
    readonly platformSessionId: MediaPlatformSessionId;
    readonly mediaSessionId: MediaSessionId;
    readonly endedBy: ParticipantId;
    readonly endedAt: IsoDateString;
  };
}

// ============================================================================
// Event Union Types
// ============================================================================

/** Union of all media session events. */
export type MediaSessionEvent =
  | MediaSessionCreatedEvent
  | MediaSessionReadyEvent
  | MediaSessionActivatedEvent
  | MediaSessionPausedEvent
  | MediaSessionRecoveredEvent
  | MediaSessionClosedEvent;

/** Union of all audio engine events. */
export type AudioEngineEvent =
  | AudioSessionCreatedEvent
  | AudioProcessingStartedEvent
  | AudioQualityDegradedEvent
  | AudioRecoveredEvent
  | AudioSessionClosedEvent
  | AudioMetricsUpdatedEvent;

/** Union of all video engine events. */
export type VideoEngineEvent =
  | VideoSessionCreatedEvent
  | VideoProcessingStartedEvent
  | VideoResolutionChangedEvent
  | VideoFrameRateChangedEvent
  | VideoQualityDegradedEvent
  | VideoRecoveredEvent
  | VideoMetricsUpdatedEvent
  | VideoSessionClosedEvent;

/** Union of all network layer events. */
export type NetworkLayerEvent =
  | NetworkSessionCreatedEvent
  | PeerConnectionEstablishedEvent
  | StreamNegotiationCompletedEvent
  | MediaNetworkQualityDegradedEvent
  | NetworkRecoveredEvent
  | PeerDisconnectedEvent
  | PeerReconnectedEvent
  | RoutingChangedEvent
  | NetworkSessionClosedEvent;

/** Union of all screen share events. */
export type ScreenShareEvent =
  | ScreenShareSessionCreatedEvent
  | ScreenCaptureStartedEvent
  | ScreenSourceChangedEvent
  | ScreenRegionUpdatedEvent
  | ScreenQualityDegradedEvent
  | ScreenRecoveredEvent
  | ScreenMetricsUpdatedEvent
  | ScreenShareSessionClosedEvent;

/** Union of all device events. */
export type DeviceEvent =
  | DeviceSelectedEvent
  | DeviceChangedEvent
  | DeviceUnavailableEvent
  | DevicePermissionDeniedEvent
  | DeviceRecoveredEvent;

/** Union of all orchestrator events. */
export type OrchestratorEvent =
  | MediaOrchestrationStartedEvent
  | MediaGlobalStateChangedEvent
  | SubsystemCoordinationEvent
  | QualityPolicyAppliedEvent
  | RecoveryInitiatedEvent
  | RecoveryCompletedEvent
  | MediaOrchestrationStoppedEvent;

/** Union of all platform session events. */
export type PlatformSessionEvent =
  | MediaPlatformSessionCreatedEvent
  | MediaPlatformSessionStateChangedEvent
  | ParticipantRoleUpdatedEvent
  | SessionPolicyAppliedEvent
  | MediaPlatformSessionEndedEvent;

/** Union of all media-related domain events. */
export type MediaEvent =
  | MediaSessionEvent
  | AudioEngineEvent
  | VideoEngineEvent
  | NetworkLayerEvent
  | ScreenShareEvent
  | DeviceEvent
  | OrchestratorEvent
  | PlatformSessionEvent;