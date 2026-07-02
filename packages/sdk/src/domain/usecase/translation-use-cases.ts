import { inject, injectable } from 'tsyringe';

import type { MeetingId, ParticipantId, Result, TranslationSessionId } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { TranslationSession } from '../model/translation.js';
import { TRANSLATION_CONSTRAINTS } from '../model/translation.js';
import type {
  TranslationEventCallbacks,
  TranslationGateway,
  TranslationRouter,
  TranslationSessionRepository,
} from '../port/translation-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Start Translation Use Case
// ============================================================================

/**
 * Start translation command.
 *
 * Per `feature-translation/SPECIFICATION.md`: command to start a translation session.
 */
export interface StartTranslationCommand {
  readonly meetingId: MeetingId;
  readonly sourceLanguage: string;
  readonly targetLanguage: string;
  readonly callbacks?: TranslationEventCallbacks;
}

/**
 * Start translation use case.
 *
 * Per `feature-translation/SPECIFICATION.md`: starts a new translation session
 * for a language pair. One session per target language per meeting.
 */
@injectable()
export class StartTranslationUseCase
  implements UseCase<StartTranslationCommand, TranslationSessionId, Error>
{
  constructor(
    @inject(TOKENS.TranslationSessionRepository)
    private readonly sessionRepository: TranslationSessionRepository,
    @inject(TOKENS.TranslationGateway)
    private readonly gateway: TranslationGateway,
  ) {}

  async execute(command: StartTranslationCommand): Promise<Result<TranslationSessionId, Error>> {
    // Check if max sessions exceeded
    const countResult = await this.sessionRepository.countActiveSessions(command.meetingId);
    if (countResult.isFailure) {
      return failure(new Error('Failed to count active sessions'));
    }

    if (countResult.value >= TRANSLATION_CONSTRAINTS.MAX_SESSIONS_PER_MEETING) {
      return failure(
        new Error(
          `Maximum translation sessions exceeded (${TRANSLATION_CONSTRAINTS.MAX_SESSIONS_PER_MEETING})`,
        ),
      );
    }

    // Check if session for this language already exists
    const existingSession = await this.sessionRepository.getSessionByLanguage(
      command.meetingId,
      command.targetLanguage,
    );

    if (existingSession.isFailure) {
      return failure(new Error('Failed to check existing session'));
    }

    if (existingSession.value !== null) {
      // Session already exists for this language
      return success(existingSession.value.id);
    }

    // Start new session via gateway
    const startResult = await this.gateway.startSession(
      command.meetingId,
      command.sourceLanguage,
      command.targetLanguage,
      command.callbacks,
    );

    return startResult;
  }
}

// ============================================================================
// Stop Translation Use Case
// ============================================================================

/**
 * Stop translation command.
 *
 * Per `feature-translation/SPECIFICATION.md`: command to stop a translation session.
 */
export interface StopTranslationCommand {
  readonly sessionId: TranslationSessionId;
  readonly reason: 'meeting_ended' | 'user_action' | 'error' | 'timeout' | 'system_cleanup';
}

/**
 * Stop translation use case.
 *
 * Per `feature-translation/SPECIFICATION.md`: stops a translation session.
 */
@injectable()
export class StopTranslationUseCase
  implements UseCase<StopTranslationCommand, void, Error>
{
  constructor(
    @inject(TOKENS.TranslationGateway)
    private readonly gateway: TranslationGateway,
  ) {}

  async execute(command: StopTranslationCommand): Promise<Result<void, Error>> {
    return this.gateway.stopSession(command.sessionId, command.reason);
  }
}

// ============================================================================
// Change Target Language Use Case
// ============================================================================

/**
 * Change target language command.
 *
 * Per `feature-translation/SPECIFICATION.md`: command to change participant's target language.
 */
export interface ChangeTargetLanguageCommand {
  readonly participantId: ParticipantId;
  readonly meetingId: MeetingId;
  readonly targetLanguage: string;
}

/**
 * Change target language use case.
 *
 * Per `feature-translation/SPECIFICATION.md`: changes a participant's target language
 * for translation routing.
 */
@injectable()
export class ChangeTargetLanguageUseCase
  implements UseCase<ChangeTargetLanguageCommand, void, Error>
{
  constructor(
    @inject(TOKENS.TranslationRouter)
    private readonly router: TranslationRouter,
  ) {}

  async execute(command: ChangeTargetLanguageCommand): Promise<Result<void, Error>> {
    const result = await this.router.addParticipantLanguagePreference(
      command.participantId,
      command.meetingId,
      command.targetLanguage,
    );

    if (result.isFailure) {
      return failure(new Error('Failed to change target language'));
    }

    return success(undefined);
  }
}

// ============================================================================
// Stream Audio to Translation Use Case
// ============================================================================

/**
 * Stream audio to translation command.
 *
 * Per `feature-translation/SPECIFICATION.md`: command to stream audio to all active sessions.
 */
export interface StreamAudioToTranslationCommand {
  readonly meetingId: MeetingId;
  readonly audioChunk: ArrayBuffer;
}

/**
 * Stream audio to translation use case.
 *
 * Per `feature-translation/SPECIFICATION.md`: broadcasts audio to all active
 * translation sessions for a meeting.
 */
@injectable()
export class StreamAudioToTranslationUseCase
  implements UseCase<StreamAudioToTranslationCommand, number, Error>
{
  constructor(
    @inject(TOKENS.TranslationGateway)
    private readonly gateway: TranslationGateway,
  ) {}

  async execute(command: StreamAudioToTranslationCommand): Promise<Result<number, Error>> {
    return this.gateway.broadcastAudio(command.meetingId, command.audioChunk);
  }
}

// ============================================================================
// Get Active Translation Sessions Use Case
// ============================================================================

/**
 * Get active translation sessions command.
 */
export interface GetActiveTranslationSessionsCommand {
  readonly meetingId: MeetingId;
}

/**
 * Get active translation sessions use case.
 */
@injectable()
export class GetActiveTranslationSessionsUseCase
  implements UseCase<GetActiveTranslationSessionsCommand, ReadonlyArray<TranslationSession>, Error>
{
  constructor(
    @inject(TOKENS.TranslationSessionRepository)
    private readonly sessionRepository: TranslationSessionRepository,
  ) {}

  async execute(
    command: GetActiveTranslationSessionsCommand,
  ): Promise<Result<ReadonlyArray<TranslationSession>, Error>> {
    return this.sessionRepository.getActiveSessionsByMeeting(command.meetingId);
  }
}