import type { Result } from '@aimeetx/types';

/**
 * Base interface for all use cases in the SDK.
 *
 * Per ADR-004 (Clean Architecture) and `05_CODING_STANDARDS.md` §18:
 * "One responsibility only. Use Cases are single-responsibility."
 *
 * Use cases are the entry point for all business logic. They:
 * - Accept a Command (input)
 * - Coordinate repositories and other use cases
 * - Return a Result<T, E> (output)
 * - Never throw exceptions to the caller
 *
 * @example
 * ```ts
 * class JoinMeetingUseCase implements UseCase<JoinMeetingCommand, Meeting, MeetingError> {
 *   constructor(
 *     @inject(TOKENS.MeetingRepository) private readonly meetingRepo: MeetingRepository,
 *   ) {}
 *
 *   async execute(command: JoinMeetingCommand): Promise<Result<Meeting, MeetingError>> {
 *     const meeting = await this.meetingRepo.findById(command.meetingId);
 *     if (meeting.isFailure) return failure(meeting.error);
 *     // ... business logic
 *     return success(meeting.value);
 *   }
 * }
 * ```
 */
export interface UseCase<TCommand, TOutput, TError = Error> {
  execute(command: TCommand): Promise<Result<TOutput, TError>>;
}