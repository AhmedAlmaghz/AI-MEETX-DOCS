import { inject, injectable } from 'tsyringe';

import type {
  ClassroomSessionId,
  IsoDateString,
  ParticipantId,
  Result,
  Uuid,
} from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  WhiteboardOperation,
  WhiteboardPoint,
  WhiteboardState,
  WhiteboardStrokeStyle,
} from '../model/whiteboard.js';
import { WHITEBOARD_CONSTRAINTS } from '../model/whiteboard.js';
import type {
  WhiteboardRepository,
  WhiteboardSyncGateway,
} from '../port/whiteboard-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a UUID.
 */
function generateUuid(): Uuid {
  return crypto.randomUUID() as Uuid;
}

/**
 * Get current ISO timestamp.
 */
function now(): IsoDateString {
  return new Date().toISOString() as IsoDateString;
}

// ============================================================================
// StartStrokeUseCase
// ============================================================================

/**
 * Command for StartStrokeUseCase.
 */
export interface StartStrokeCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly point: WhiteboardPoint;
  readonly style: WhiteboardStrokeStyle;
}

/**
 * StartStrokeUseCase — begins a new drawing stroke.
 *
 * Per `feature-classroom/SPECIFICATION.md`: whiteboard drawing syncs across participants.
 */
@injectable()
export class StartStrokeUseCase
  implements UseCase<StartStrokeCommand, WhiteboardOperation, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
  ) {}

  async execute(
    command: StartStrokeCommand,
  ): Promise<Result<WhiteboardOperation, Error>> {
    const { sessionId, participantId, point, style } = command;

    // Validate line width
    if (
      style.lineWidth < WHITEBOARD_CONSTRAINTS.MIN_LINE_WIDTH ||
      style.lineWidth > WHITEBOARD_CONSTRAINTS.MAX_LINE_WIDTH
    ) {
      return failure(
        new Error(
          `Line width must be between ${WHITEBOARD_CONSTRAINTS.MIN_LINE_WIDTH} and ${WHITEBOARD_CONSTRAINTS.MAX_LINE_WIDTH}`,
        ),
      );
    }

    const operation: WhiteboardOperation = {
      id: generateUuid(),
      sessionId,
      participantId,
      type: 'stroke_start',
      point,
      style,
      timestamp: now(),
    };

    // Send operation to sync gateway
    const result = await this.syncGateway.sendOperation(operation);
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(operation);
  }
}

// ============================================================================
// MoveStrokeUseCase
// ============================================================================

/**
 * Command for MoveStrokeUseCase.
 */
export interface MoveStrokeCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly point: WhiteboardPoint;
}

/**
 * MoveStrokeUseCase — adds a point to the current stroke.
 */
@injectable()
export class MoveStrokeUseCase
  implements UseCase<MoveStrokeCommand, WhiteboardOperation, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
  ) {}

  async execute(
    command: MoveStrokeCommand,
  ): Promise<Result<WhiteboardOperation, Error>> {
    const { sessionId, participantId, point } = command;

    const operation: WhiteboardOperation = {
      id: generateUuid(),
      sessionId,
      participantId,
      type: 'stroke_move',
      point,
      timestamp: now(),
    };

    const result = await this.syncGateway.sendOperation(operation);
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(operation);
  }
}

// ============================================================================
// EndStrokeUseCase
// ============================================================================

/**
 * Command for EndStrokeUseCase.
 */
export interface EndStrokeCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly point: WhiteboardPoint;
}

/**
 * EndStrokeUseCase — completes a drawing stroke.
 */
@injectable()
export class EndStrokeUseCase
  implements UseCase<EndStrokeCommand, WhiteboardOperation, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
  ) {}

  async execute(
    command: EndStrokeCommand,
  ): Promise<Result<WhiteboardOperation, Error>> {
    const { sessionId, participantId, point } = command;

    const operation: WhiteboardOperation = {
      id: generateUuid(),
      sessionId,
      participantId,
      type: 'stroke_end',
      point,
      timestamp: now(),
    };

    // Send operation to sync gateway
    const result = await this.syncGateway.sendOperation(operation);
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(operation);
  }
}

// ============================================================================
// ClearWhiteboardUseCase
// ============================================================================

/**
 * Command for ClearWhiteboardUseCase.
 */
export interface ClearWhiteboardCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
}

/**
 * ClearWhiteboardUseCase — clears all strokes from the whiteboard.
 */
@injectable()
export class ClearWhiteboardUseCase
  implements UseCase<ClearWhiteboardCommand, WhiteboardState, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
    @inject(TOKENS.WhiteboardRepository)
    private readonly whiteboardRepository: WhiteboardRepository,
  ) {}

  async execute(
    command: ClearWhiteboardCommand,
  ): Promise<Result<WhiteboardState, Error>> {
    const { sessionId, participantId } = command;

    // Send clear operation
    const operation: WhiteboardOperation = {
      id: generateUuid(),
      sessionId,
      participantId,
      type: 'clear',
      timestamp: now(),
    };

    const syncResult = await this.syncGateway.sendOperation(operation);
    if (syncResult.isFailure) {
      return failure(syncResult.error);
    }

    // Clear in repository
    const result = await this.whiteboardRepository.clearStrokes(sessionId);
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(result.value);
  }
}

// ============================================================================
// UndoStrokeUseCase
// ============================================================================

/**
 * Command for UndoStrokeUseCase.
 */
export interface UndoStrokeCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
}

/**
 * UndoStrokeUseCase — undoes the last stroke by a participant.
 */
@injectable()
export class UndoStrokeUseCase
  implements UseCase<UndoStrokeCommand, WhiteboardState, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
    @inject(TOKENS.WhiteboardRepository)
    private readonly whiteboardRepository: WhiteboardRepository,
  ) {}

  async execute(
    command: UndoStrokeCommand,
  ): Promise<Result<WhiteboardState, Error>> {
    const { sessionId, participantId } = command;

    // Send undo operation
    const operation: WhiteboardOperation = {
      id: generateUuid(),
      sessionId,
      participantId,
      type: 'undo',
      timestamp: now(),
    };

    const syncResult = await this.syncGateway.sendOperation(operation);
    if (syncResult.isFailure) {
      return failure(syncResult.error);
    }

    // Undo in repository
    const result = await this.whiteboardRepository.undoLastStroke(
      sessionId,
      participantId,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(result.value);
  }
}

// ============================================================================
// GetWhiteboardStateUseCase
// ============================================================================

/**
 * Command for GetWhiteboardStateUseCase.
 */
export interface GetWhiteboardStateCommand {
  readonly sessionId: ClassroomSessionId;
}

/**
 * GetWhiteboardStateUseCase — retrieves the current whiteboard state.
 */
@injectable()
export class GetWhiteboardStateUseCase
  implements UseCase<GetWhiteboardStateCommand, WhiteboardState | null, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardRepository)
    private readonly whiteboardRepository: WhiteboardRepository,
  ) {}

  async execute(
    command: GetWhiteboardStateCommand,
  ): Promise<Result<WhiteboardState | null, Error>> {
    const result = await this.whiteboardRepository.getState(command.sessionId);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(result.value);
  }
}

// ============================================================================
// ConnectWhiteboardUseCase
// ============================================================================

/**
 * Command for ConnectWhiteboardUseCase.
 */
export interface ConnectWhiteboardCommand {
  readonly sessionId: ClassroomSessionId;
  readonly participantId: ParticipantId;
  readonly callbacks: {
    readonly onOperation: (operation: WhiteboardOperation) => void;
    readonly onStateSync: (state: WhiteboardState) => void;
    readonly onCursorUpdate: (
      participantId: ParticipantId,
      x: number,
      y: number,
    ) => void;
    readonly onParticipantJoined: (participantId: ParticipantId) => void;
    readonly onParticipantLeft: (participantId: ParticipantId) => void;
    readonly onError: (error: Error) => void;
  };
}

/**
 * ConnectWhiteboardUseCase — connects to the whiteboard sync channel.
 */
@injectable()
export class ConnectWhiteboardUseCase
  implements UseCase<ConnectWhiteboardCommand, void, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
  ) {}

  async execute(
    command: ConnectWhiteboardCommand,
  ): Promise<Result<void, Error>> {
    const { sessionId, participantId, callbacks } = command;

    const result = await this.syncGateway.connect(
      sessionId,
      participantId,
      callbacks,
    );
    if (result.isFailure) {
      return failure(result.error);
    }

    return success(undefined);
  }
}

// ============================================================================
// DisconnectWhiteboardUseCase
// ============================================================================

/**
 * DisconnectWhiteboardUseCase — disconnects from the whiteboard sync channel.
 */
@injectable()
export class DisconnectWhiteboardUseCase
  implements UseCase<void, void, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
  ) {}

  async execute(): Promise<Result<void, Error>> {
    const result = await this.syncGateway.disconnect();
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(undefined);
  }
}

// ============================================================================
// SendCursorUpdateUseCase
// ============================================================================

/**
 * Command for SendCursorUpdateUseCase.
 */
export interface SendCursorUpdateCommand {
  readonly x: number;
  readonly y: number;
}

/**
 * SendCursorUpdateUseCase — sends cursor position to other participants.
 */
@injectable()
export class SendCursorUpdateUseCase
  implements UseCase<SendCursorUpdateCommand, void, Error>
{
  constructor(
    @inject(TOKENS.WhiteboardSyncGateway)
    private readonly syncGateway: WhiteboardSyncGateway,
  ) {}

  async execute(
    command: SendCursorUpdateCommand,
  ): Promise<Result<void, Error>> {
    const { x, y } = command;

    const result = await this.syncGateway.sendCursorUpdate(x, y);
    if (result.isFailure) {
      return failure(result.error);
    }
    return success(undefined);
  }
}