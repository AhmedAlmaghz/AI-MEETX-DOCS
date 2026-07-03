import type {
  ClassroomSessionId,
  ParticipantId,
  Result,
} from '@aimeetx/types';

import type {
  WhiteboardOperation,
  WhiteboardState,
  WhiteboardStroke,
} from '../model/whiteboard.js';

// ============================================================================
// Whiteboard Sync Gateway Port
// ============================================================================

/**
 * Whiteboard operation message for sync.
 */
export interface WhiteboardSyncMessage {
  readonly type: 'operation' | 'state_sync' | 'cursor_update';
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly operation?: WhiteboardOperation;
  readonly state?: WhiteboardState;
  readonly cursor?: { readonly x: number; readonly y: number };
  readonly timestamp: string;
}

/**
 * Callbacks for whiteboard sync events.
 */
export interface WhiteboardSyncCallbacks {
  readonly onOperation: (operation: WhiteboardOperation) => void;
  readonly onStateSync: (state: WhiteboardState) => void;
  readonly onCursorUpdate: (participantId: ParticipantId, x: number, y: number) => void;
  readonly onParticipantJoined: (participantId: ParticipantId) => void;
  readonly onParticipantLeft: (participantId: ParticipantId) => void;
  readonly onError: (error: Error) => void;
}

/**
 * Whiteboard sync gateway port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * Implementation uses WebSocket or LiveKit Data Channels.
 *
 * Per `feature-classroom/SPECIFICATION.md`: whiteboard drawing syncs across participants.
 */
export interface WhiteboardSyncGateway {
  /** Connect to whiteboard sync channel. */
  connect(
    sessionId: ClassroomSessionId,
    participantId: ParticipantId,
    callbacks: WhiteboardSyncCallbacks,
  ): Promise<Result<void, Error>>;

  /** Disconnect from whiteboard sync channel. */
  disconnect(): Promise<Result<void, Error>>;

  /** Send a drawing operation to all participants. */
  sendOperation(operation: WhiteboardOperation): Promise<Result<void, Error>>;

  /** Request full state sync from server. */
  requestStateSync(): Promise<Result<void, Error>>;

  /** Send cursor position update. */
  sendCursorUpdate(x: number, y: number): Promise<Result<void, Error>>;

  /** Get current connection state. */
  isConnected(): boolean;
}

// ============================================================================
// Whiteboard Repository Port
// ============================================================================

/**
 * Whiteboard repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 *
 * Per `feature-classroom/SPECIFICATION.md`: whiteboard state persistence.
 */
export interface WhiteboardRepository {
  /** Get whiteboard state for a session. */
  getState(
    sessionId: ClassroomSessionId,
  ): Promise<Result<WhiteboardState | null, Error>>;

  /** Save a stroke to the whiteboard. */
  saveStroke(stroke: WhiteboardStroke): Promise<Result<WhiteboardStroke, Error>>;

  /** Clear all strokes from the whiteboard. */
  clearStrokes(
    sessionId: ClassroomSessionId,
  ): Promise<Result<WhiteboardState, Error>>;

  /** Undo the last stroke by a participant. */
  undoLastStroke(
    sessionId: ClassroomSessionId,
    participantId: ParticipantId,
  ): Promise<Result<WhiteboardState, Error>>;

  /** Get all strokes for a session. */
  getStrokes(
    sessionId: ClassroomSessionId,
  ): Promise<Result<ReadonlyArray<WhiteboardStroke>, Error>>;
}