import type {
  ClassroomSessionId,
  IsoDateString,
  ParticipantId,
  Uuid,
} from '@aimeetx/types';

// ============================================================================
// Whiteboard Drawing Types
// ============================================================================

/**
 * Point coordinate on the whiteboard.
 */
export interface WhiteboardPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Stroke style for drawing.
 */
export interface WhiteboardStrokeStyle {
  readonly color: string;
  readonly lineWidth: number;
  readonly lineCap: 'butt' | 'round' | 'square';
  readonly lineJoin: 'round' | 'bevel' | 'miter';
}

/**
 * Drawing operation types.
 */
export type WhiteboardOperationType =
  | 'stroke_start'
  | 'stroke_move'
  | 'stroke_end'
  | 'clear'
  | 'undo'
  | 'erase';

/**
 * Whiteboard drawing operation.
 *
 * Per `feature-classroom/SPECIFICATION.md`: whiteboard drawing syncs across participants.
 */
export interface WhiteboardOperation {
  readonly id: Uuid;
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly type: WhiteboardOperationType;
  readonly point?: WhiteboardPoint;
  readonly style?: WhiteboardStrokeStyle;
  readonly timestamp: IsoDateString;
}

/**
 * Whiteboard stroke (collection of points from stroke_start to stroke_end).
 */
export interface WhiteboardStroke {
  readonly id: Uuid;
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly points: ReadonlyArray<WhiteboardPoint>;
  readonly style: WhiteboardStrokeStyle;
  readonly startedAt: IsoDateString;
  readonly endedAt: IsoDateString | null;
}

/**
 * Whiteboard state (aggregate of all strokes).
 */
export interface WhiteboardState {
  readonly sessionId: ClassroomSessionId;
  readonly strokes: ReadonlyArray<WhiteboardStroke>;
  readonly lastOperation: WhiteboardOperation | null;
  readonly updatedAt: IsoDateString;
}

// ============================================================================
// Whiteboard Constraints
// ============================================================================

/**
 * Whiteboard constraints.
 */
export const WHITEBOARD_CONSTRAINTS = {
  MAX_STROKES: 10000,
  MAX_POINTS_PER_STROKE: 5000,
  MIN_LINE_WIDTH: 1,
  MAX_LINE_WIDTH: 50,
  THROTTLE_MS: 16, // ~60fps
} as const;

// ============================================================================
// Whiteboard Errors
// ============================================================================

/**
 * Whiteboard error types.
 */
export type WhiteboardError =
  | { readonly code: 'WhiteboardNotFound'; readonly message: string }
  | { readonly code: 'MaxStrokesExceeded'; readonly message: string }
  | { readonly code: 'InvalidOperation'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };