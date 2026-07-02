import { inject, injectable } from 'tsyringe';

import type { MeetingId, Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  ActionItem,
  MeetingReport,
  MeetingSummary,
  TranscriptContextSegment,
} from '../model/ai.js';
import { AI_CONSTRAINTS } from '../model/ai.js';
import type {
  ActionItemRepository,
  AiMeetingService,
  MeetingReportRepository,
  MeetingSummaryRepository,
  TranscriptContextRepository,
} from '../port/ai-repository.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// Process Transcript Segment Use Case
// ============================================================================

/**
 * Process transcript segment command.
 *
 * Per `feature-ai/SPECIFICATION.md`: command to process a transcript segment.
 */
export interface ProcessTranscriptSegmentCommand {
  readonly meetingId: MeetingId;
  readonly segment: TranscriptContextSegment;
}

/**
 * Process transcript segment use case.
 *
 * Per `feature-ai/SPECIFICATION.md`: processes a transcript segment by adding
 * it to the context window and triggering AI updates.
 */
@injectable()
export class ProcessTranscriptSegmentUseCase
  implements UseCase<ProcessTranscriptSegmentCommand, void, Error>
{
  constructor(
    @inject(TOKENS.TranscriptContextRepository)
    private readonly contextRepository: TranscriptContextRepository,
    @inject(TOKENS.AiMeetingService)
    private readonly aiService: AiMeetingService,
  ) {}

  async execute(command: ProcessTranscriptSegmentCommand): Promise<Result<void, Error>> {
    // Add segment to context window
    const addResult = await this.contextRepository.addSegment(
      command.meetingId,
      command.segment,
    );

    if (addResult.isFailure) {
      return failure(new Error('Failed to add segment to context'));
    }

    // Process segment through AI service
    const processResult = await this.aiService.processTranscriptSegment(
      command.meetingId,
      command.segment,
    );

    if (processResult.isFailure) {
      return failure(new Error('Failed to process segment'));
    }

    return success(undefined);
  }
}

// ============================================================================
// Generate Running Summary Use Case
// ============================================================================

/**
 * Generate running summary command.
 *
 * Per `feature-ai/SPECIFICATION.md`: command to generate a running summary.
 */
export interface GenerateRunningSummaryCommand {
  readonly meetingId: MeetingId;
}

/**
 * Generate running summary use case.
 *
 * Per `feature-ai/SPECIFICATION.md`: generates a running summary of the meeting
 * based on the current transcript context.
 */
@injectable()
export class GenerateRunningSummaryUseCase
  implements UseCase<GenerateRunningSummaryCommand, MeetingSummary, Error>
{
  constructor(
    @inject(TOKENS.AiMeetingService)
    private readonly aiService: AiMeetingService,
    @inject(TOKENS.TranscriptContextRepository)
    private readonly contextRepository: TranscriptContextRepository,
  ) {}

  async execute(command: GenerateRunningSummaryCommand): Promise<Result<MeetingSummary, Error>> {
    // Check context window has content
    const contextResult = await this.contextRepository.getContextWindow(command.meetingId);

    if (contextResult.isFailure) {
      return failure(new Error('Failed to get context window'));
    }

    if (contextResult.value.segments.length === 0) {
      return failure(new Error('No transcript segments available'));
    }

    // Generate summary via AI service
    const summaryResult = await this.aiService.generateRunningSummary(command.meetingId);

    if (summaryResult.isFailure) {
      return failure(new Error('Failed to generate summary'));
    }

    return success(summaryResult.value);
  }
}

// ============================================================================
// Extract Action Items Use Case
// ============================================================================

/**
 * Extract action items command.
 *
 * Per `feature-ai/SPECIFICATION.md`: command to extract action items.
 */
export interface ExtractActionItemsCommand {
  readonly meetingId: MeetingId;
}

/**
 * Extract action items use case.
 *
 * Per `feature-ai/SPECIFICATION.md`: extracts action items from the meeting
 * transcript using AI analysis.
 */
@injectable()
export class ExtractActionItemsUseCase
  implements UseCase<ExtractActionItemsCommand, ReadonlyArray<ActionItem>, Error>
{
  constructor(
    @inject(TOKENS.AiMeetingService)
    private readonly aiService: AiMeetingService,
    @inject(TOKENS.TranscriptContextRepository)
    private readonly contextRepository: TranscriptContextRepository,
  ) {}

  async execute(
    command: ExtractActionItemsCommand,
  ): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    // Check context window has content
    const contextResult = await this.contextRepository.getContextWindow(command.meetingId);

    if (contextResult.isFailure) {
      return failure(new Error('Failed to get context window'));
    }

    if (contextResult.value.segments.length === 0) {
      return failure(new Error('No transcript segments available'));
    }

    // Extract action items via AI service
    const itemsResult = await this.aiService.detectActionItems(command.meetingId);

    if (itemsResult.isFailure) {
      return failure(new Error('Failed to extract action items'));
    }

    // Filter by confidence threshold
    const filteredItems = itemsResult.value.filter(
      (item) => item.confidence >= AI_CONSTRAINTS.MIN_CONFIDENCE_THRESHOLD,
    );

    return success(filteredItems);
  }
}

// ============================================================================
// Ask AI Question Use Case
// ============================================================================

/**
 * Ask AI question command.
 *
 * Per `feature-ai/SPECIFICATION.md`: command to ask the AI a question.
 */
export interface AskAiQuestionCommand {
  readonly meetingId: MeetingId;
  readonly question: string;
}

/**
 * Ask AI question use case.
 *
 * Per `feature-ai/SPECIFICATION.md`: answers a user question using the meeting
 * transcript context.
 */
@injectable()
export class AskAiQuestionUseCase
  implements UseCase<AskAiQuestionCommand, string, Error>
{
  constructor(
    @inject(TOKENS.AiMeetingService)
    private readonly aiService: AiMeetingService,
  ) {}

  async execute(command: AskAiQuestionCommand): Promise<Result<string, Error>> {
    // Validate question
    if (!command.question || command.question.trim().length === 0) {
      return failure(new Error('Question cannot be empty'));
    }

    // Answer question via AI service
    const answerResult = await this.aiService.answerQuestion({
      meetingId: command.meetingId,
      question: command.question,
    });

    if (answerResult.isFailure) {
      return failure(new Error('Failed to answer question'));
    }

    return success(answerResult.value);
  }
}

// ============================================================================
// Generate Post Meeting Report Use Case
// ============================================================================

/**
 * Generate post meeting report command.
 *
 * Per `feature-ai/SPECIFICATION.md`: command to generate a post-meeting report.
 */
export interface GeneratePostMeetingReportCommand {
  readonly meetingId: MeetingId;
}

/**
 * Generate post meeting report use case.
 *
 * Per `feature-ai/SPECIFICATION.md`: generates a comprehensive post-meeting report
 * including summary, decisions, action items, and topic breakdown.
 */
@injectable()
export class GeneratePostMeetingReportUseCase
  implements UseCase<GeneratePostMeetingReportCommand, MeetingReport, Error>
{
  constructor(
    @inject(TOKENS.AiMeetingService)
    private readonly aiService: AiMeetingService,
    @inject(TOKENS.MeetingReportRepository)
    private readonly reportRepository: MeetingReportRepository,
    @inject(TOKENS.TranscriptContextRepository)
    private readonly contextRepository: TranscriptContextRepository,
  ) {}

  async execute(
    command: GeneratePostMeetingReportCommand,
  ): Promise<Result<MeetingReport, Error>> {
    // Check if report already exists
    const existingReport = await this.reportRepository.getReportByMeeting(command.meetingId);

    if (existingReport.isFailure) {
      return failure(new Error('Failed to check existing report'));
    }

    if (existingReport.value !== null && existingReport.value.status === 'generating') {
      return failure(new Error('Report generation already in progress'));
    }

    // Check context window has content
    const contextResult = await this.contextRepository.getContextWindow(command.meetingId);

    if (contextResult.isFailure) {
      return failure(new Error('Failed to get context window'));
    }

    if (contextResult.value.segments.length === 0) {
      return failure(new Error('No transcript segments available'));
    }

    // Generate report via AI service
    const reportResult = await this.aiService.generatePostMeetingReport(command.meetingId);

    if (reportResult.isFailure) {
      return failure(new Error('Failed to generate report'));
    }

    return success(reportResult.value);
  }
}

// ============================================================================
// Get Meeting Summary Use Case
// ============================================================================

/**
 * Get meeting summary command.
 */
export interface GetMeetingSummaryCommand {
  readonly meetingId: MeetingId;
}

/**
 * Get meeting summary use case.
 */
@injectable()
export class GetMeetingSummaryUseCase
  implements UseCase<GetMeetingSummaryCommand, MeetingSummary | null, Error>
{
  constructor(
    @inject(TOKENS.MeetingSummaryRepository)
    private readonly summaryRepository: MeetingSummaryRepository,
  ) {}

  async execute(
    command: GetMeetingSummaryCommand,
  ): Promise<Result<MeetingSummary | null, Error>> {
    return this.summaryRepository.getLatestSummaryByMeeting(command.meetingId);
  }
}

// ============================================================================
// Get Action Items Use Case
// ============================================================================

/**
 * Get action items command.
 */
export interface GetActionItemsCommand {
  readonly meetingId: MeetingId;
}

/**
 * Get action items use case.
 */
@injectable()
export class GetActionItemsUseCase
  implements UseCase<GetActionItemsCommand, ReadonlyArray<ActionItem>, Error>
{
  constructor(
    @inject(TOKENS.ActionItemRepository)
    private readonly actionItemRepository: ActionItemRepository,
  ) {}

  async execute(
    command: GetActionItemsCommand,
  ): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    return this.actionItemRepository.getActionItemsByMeeting(command.meetingId);
  }
}

// ============================================================================
// Get Meeting Report Use Case
// ============================================================================

/**
 * Get meeting report command.
 */
export interface GetMeetingReportCommand {
  readonly meetingId: MeetingId;
}

/**
 * Get meeting report use case.
 */
@injectable()
export class GetMeetingReportUseCase
  implements UseCase<GetMeetingReportCommand, MeetingReport | null, Error>
{
  constructor(
    @inject(TOKENS.MeetingReportRepository)
    private readonly reportRepository: MeetingReportRepository,
  ) {}

  async execute(
    command: GetMeetingReportCommand,
  ): Promise<Result<MeetingReport | null, Error>> {
    return this.reportRepository.getReportByMeeting(command.meetingId);
  }
}