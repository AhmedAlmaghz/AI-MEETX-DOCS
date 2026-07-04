import type {
  ClassroomSessionId,
  IsoDateString,
  ParticipantId,
  Result,
  Uuid,
} from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import {
  ReconnectingWebSocketClient,
  type WebSocketMessage,
} from './websocket-client.js';

// ============================================================================
// Whiteboard Types (duplicated from SDK to avoid circular dependency)
// ============================================================================

/** Point coordinate on the whiteboard. */
export interface WhiteboardPoint {
  readonly x: number;
  readonly y: number;
}

/** Stroke style for drawing. */
export interface WhiteboardStrokeStyle {
  readonly color: string;
  readonly lineWidth: number;
  readonly lineCap: 'butt' | 'round' | 'square';
  readonly lineJoin: 'round' | 'bevel' | 'miter';
}

/** Drawing operation types. */
export type WhiteboardOperationType =
  | 'stroke_start'
  | 'stroke_move'
  | 'stroke_end'
  | 'clear'
  | 'undo'
  | 'erase';

/** Whiteboard drawing operation. */
export interface WhiteboardOperation {
  readonly id: Uuid;
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly type: WhiteboardOperationType;
  readonly point?: WhiteboardPoint;
  readonly style?: WhiteboardStrokeStyle;
  readonly timestamp: IsoDateString;
}

/** Whiteboard stroke. */
export interface WhiteboardStroke {
  readonly id: Uuid;
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly points: ReadonlyArray<WhiteboardPoint>;
  readonly style: WhiteboardStrokeStyle;
  readonly startedAt: IsoDateString;
  readonly endedAt: IsoDateString | null;
}

/** Whiteboard state. */
export interface WhiteboardState {
  readonly sessionId: ClassroomSessionId;
  readonly strokes: ReadonlyArray<WhiteboardStroke>;
  readonly lastOperation: WhiteboardOperation | null;
  readonly updatedAt: IsoDateString;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Whiteboard sync message sent over WebSocket.
 */
export interface WhiteboardSyncMessage {
  readonly type: 'operation' | 'state_sync' | 'cursor_update' | 'join' | 'leave';
  readonly sessionId: string;
  readonly participantId: string;
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
 * Options for WebSocket whiteboard sync gateway.
 */
export interface WebSocketWhiteboardSyncOptions {
  readonly url: string;
  readonly maxRetries?: number;
  readonly heartbeatIntervalMs?: number;
}

// ============================================================================
// WebSocket Whiteboard Sync Gateway
// ============================================================================

/**
 * WebSocket-based whiteboard sync gateway.
 *
 * Per `feature-classroom/SPECIFICATION.md`: whiteboard drawing syncs across participants.
 * Uses WebSocket with automatic reconnection per ADR-001.
 *
 * @example
 * ```ts
 * const gateway = new WebSocketWhiteboardSyncGateway({
 *   url: 'wss://api.example.com/whiteboard',
 * });
 *
 * await gateway.connect(sessionId, participantId, {
 *   onOperation: (op) => drawOperation(op),
 *   onStateSync: (state) => renderState(state),
 *   onCursorUpdate: (pid, x, y) => updateCursor(pid, x, y),
 *   onParticipantJoined: (pid) => showParticipant(pid),
 *   onParticipantLeft: (pid) => hideParticipant(pid),
 *   onError: (err) => handleError(err),
 * });
 *
 * // Send drawing operation
 * await gateway.sendOperation(operation);
 * ```
 */
export class WebSocketWhiteboardSyncGateway {
  private client: ReconnectingWebSocketClient | null = null;
  private callbacks: WhiteboardSyncCallbacks | null = null;
  private sessionId: ClassroomSessionId | null = null;
  private participantId: ParticipantId | null = null;
  private connected = false;

  constructor(private readonly options: WebSocketWhiteboardSyncOptions) {}

  /**
   * Connect to whiteboard sync channel.
   */
  connect(
    sessionId: ClassroomSessionId,
    participantId: ParticipantId,
    callbacks: WhiteboardSyncCallbacks,
  ): Promise<Result<void, Error>> {
    if (this.connected) {
      return Promise.resolve(failure(new Error('Already connected')));
    }

    this.sessionId = sessionId;
    this.participantId = participantId;
    this.callbacks = callbacks;

    // Build WebSocket URL with session and participant info
    const url = `${this.options.url}?sessionId=${sessionId}&participantId=${participantId}`;

    this.client = new ReconnectingWebSocketClient({
      url,
      maxRetries: this.options.maxRetries ?? 10,
      heartbeatIntervalMs: this.options.heartbeatIntervalMs ?? 30000,
      heartbeatMessage: JSON.stringify({ type: 'ping' }),
    });

    // Subscribe to messages
    this.client.messages$.subscribe((msg) => this.handleMessage(msg));

    // Subscribe to state changes
    this.client.state$.subscribe((state) => {
      if (state === 'open' && !this.connected) {
        this.connected = true;
        // Send join message
        this.sendJoinMessage();
      }
    });

    this.client.connect();

    return Promise.resolve(success(undefined));
  }

  /**
   * Disconnect from whiteboard sync channel.
   */
  disconnect(): Promise<Result<void, Error>> {
    if (!this.connected || !this.client) {
      return Promise.resolve(success(undefined));
    }

    // Send leave message
    if (this.sessionId && this.participantId) {
      const leaveMessage: WhiteboardSyncMessage = {
        type: 'leave',
        sessionId: this.sessionId,
        participantId: this.participantId,
        timestamp: new Date().toISOString(),
      };
      this.client.send(JSON.stringify(leaveMessage));
    }

    this.client.close();
    this.client = null;
    this.callbacks = null;
    this.sessionId = null;
    this.participantId = null;
    this.connected = false;

    return Promise.resolve(success(undefined));
  }

  /**
   * Send a drawing operation to all participants.
   */
  sendOperation(operation: WhiteboardOperation): Promise<Result<void, Error>> {
    if (!this.connected || !this.client) {
      return Promise.resolve(failure(new Error('Not connected')));
    }

    const message: WhiteboardSyncMessage = {
      type: 'operation',
      sessionId: operation.sessionId,
      participantId: operation.participantId,
      operation,
      timestamp: new Date().toISOString(),
    };

    this.client.send(JSON.stringify(message));
    return Promise.resolve(success(undefined));
  }

  /**
   * Request full state sync from server.
   */
  requestStateSync(): Promise<Result<void, Error>> {
    if (!this.connected || !this.client) {
      return Promise.resolve(failure(new Error('Not connected')));
    }

    const message = {
      type: 'request_state_sync',
      sessionId: this.sessionId,
      participantId: this.participantId,
      timestamp: new Date().toISOString(),
    };

    this.client.send(JSON.stringify(message));
    return Promise.resolve(success(undefined));
  }

  /**
   * Send cursor position update.
   */
  sendCursorUpdate(x: number, y: number): Promise<Result<void, Error>> {
    if (!this.connected || !this.client || !this.sessionId || !this.participantId) {
      return Promise.resolve(failure(new Error('Not connected')));
    }

    const message: WhiteboardSyncMessage = {
      type: 'cursor_update',
      sessionId: this.sessionId,
      participantId: this.participantId,
      cursor: { x, y },
      timestamp: new Date().toISOString(),
    };

    this.client.send(JSON.stringify(message));
    return Promise.resolve(success(undefined));
  }

  /**
   * Get current connection state.
   */
  isConnected(): boolean {
    return this.connected;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private handleMessage(message: WebSocketMessage): void {
    if (typeof message !== 'string' || !this.callbacks) {
      return;
    }

    try {
      const data = JSON.parse(message) as WhiteboardSyncMessage;

      switch (data.type) {
        case 'operation':
          if (data.operation) {
            this.callbacks.onOperation(data.operation);
          }
          break;

        case 'state_sync':
          if (data.state) {
            this.callbacks.onStateSync(data.state);
          }
          break;

        case 'cursor_update':
          if (data.cursor) {
            this.callbacks.onCursorUpdate(
              data.participantId as ParticipantId,
              data.cursor.x,
              data.cursor.y,
            );
          }
          break;

        case 'join':
          this.callbacks.onParticipantJoined(data.participantId as ParticipantId);
          break;

        case 'leave':
          this.callbacks.onParticipantLeft(data.participantId as ParticipantId);
          break;
      }
    } catch (error) {
      this.callbacks.onError(
        error instanceof Error ? error : new Error('Failed to parse message'),
      );
    }
  }

  private sendJoinMessage(): void {
    if (!this.client || !this.sessionId || !this.participantId) {
      return;
    }

    const message: WhiteboardSyncMessage = {
      type: 'join',
      sessionId: this.sessionId,
      participantId: this.participantId,
      timestamp: new Date().toISOString(),
    };

    this.client.send(JSON.stringify(message));
  }
}