import type {
  ActionItemId,
  MeetingId,
  ReportId,
  Result,
  SummaryId,
} from '@aimeetx/types';

import type {
  ActionItem,
  MeetingReport,
  MeetingSummary,
  MeetingTranscriptContext,
  TranscriptContextSegment,
} from '../model/ai.js';

// ============================================================================
// Meeting Summary Repository Port
// ============================================================================

/**
 * Create meeting summary input.
 *
 * Per `feature-ai/SPECIFICATION.md`: summary creation parameters.
 */
export interface CreateMeetingSummaryInput {
  readonly meetingId: MeetingId;
  readonly summaryText: string;
  readonly keyTopics: ReadonlyArray<string>;
  readonly isFinal: boolean;
}

/**
 * Meeting summary repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer.
 *
 * Per `feature-ai/SPECIFICATION.md`: Meeting summary repository operations.
 */
export interface MeetingSummaryRepository {
  /** Create a new meeting summary. */
  createSummary(input: CreateMeetingSummaryInput): Promise<Result<MeetingSummary, Error>>;

  /** Get a summary by ID. */
  getSummary(summaryId: SummaryId): Promise<Result<MeetingSummary | null, Error>>;

  /** Get the latest summary for a meeting. */
  getLatestSummaryByMeeting(meetingId: MeetingId): Promise<Result<MeetingSummary | null, Error>>;

  /** Update a summary. */
  updateSummary(
    summaryId: SummaryId,
    update: {
      readonly summaryText?: string;
      readonly keyTopics?: ReadonlyArray<string>;
      readonly isFinal?: boolean;
    },
  ): Promise<Result<MeetingSummary, Error>>;

  /** Mark a summary as final. */
  markAsFinal(summaryId: SummaryId): Promise<Result<MeetingSummary, Error>>;

  /** Delete all summaries for a meeting. */
  deleteSummariesByMeeting(meetingId: MeetingId): Promise<Result<number, Error>>;
}

// ============================================================================
// Action Item Repository Port
// ============================================================================

/**
 * Create action item input.
 *
 * Per `feature-ai/SPECIFICATION.md`: action item creation parameters.
 */
export interface CreateActionItemInput {
  readonly meetingId: MeetingId;
  readonly description: string;
  readonly assignedTo: string | null;
  readonly dueDate: string | null;
  readonly confidence: number;
}

/**
 * Action item repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer.
 *
 * Per `feature-ai/SPECIFICATION.md`: Action item repository operations.
 */
export interface ActionItemRepository {
  /** Create a new action item. */
  createActionItem(input: CreateActionItemInput): Promise<Result<ActionItem, Error>>;

  /** Save multiple action items in batch. */
  saveAll(items: ReadonlyArray<CreateActionItemInput>): Promise<Result<ReadonlyArray<ActionItem>, Error>>;

  /** Get an action item by ID. */
  getActionItem(actionItemId: ActionItemId): Promise<Result<ActionItem | null, Error>>;

  /** Get all action items for a meeting. */
  getActionItemsByMeeting(meetingId: MeetingId): Promise<Result<ReadonlyArray<ActionItem>, Error>>;

  /** Update an action item. */
  updateActionItem(
    actionItemId: ActionItemId,
    update: {
      readonly description?: string;
      readonly assignedTo?: string | null;
      readonly dueDate?: string | null;
    },
  ): Promise<Result<ActionItem, Error>>;

  /** Delete an action item. */
  deleteActionItem(actionItemId: ActionItemId): Promise<Result<void, Error>>;

  /** Delete all action items for a meeting. */
  deleteActionItemsByMeeting(meetingId: MeetingId): Promise<Result<number, Error>>;
}

// ============================================================================
// Meeting Report Repository Port
// ============================================================================

/**
 * Create meeting report input.
 *
 * Per `feature-ai/SPECIFICATION.md`: report creation parameters.
 */
export interface CreateMeetingReportInput {
  readonly meetingId: MeetingId;
  readonly summary: string;
  readonly decisions: ReadonlyArray<string>;
  readonly actionItems: ReadonlyArray<ActionItem>;
  readonly topicBreakdown: Readonly<Record<string, number>>;
}

/**
 * Meeting report repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer.
 *
 * Per `feature-ai/SPECIFICATION.md`: Meeting report repository operations.
 */
export interface MeetingReportRepository {
  /** Create a new meeting report. */
  createReport(input: CreateMeetingReportInput): Promise<Result<MeetingReport, Error>>;

  /** Get a report by ID. */
  getReport(reportId: ReportId): Promise<Result<MeetingReport | null, Error>>;

  /** Get report by meeting ID. */
  getReportByMeeting(meetingId: MeetingId): Promise<Result<MeetingReport | null, Error>>;

  /** Update a report. */
  updateReport(
    reportId: ReportId,
    update: {
      readonly summary?: string;
      readonly decisions?: ReadonlyArray<string>;
      readonly actionItems?: ReadonlyArray<ActionItem>;
      readonly topicBreakdown?: Readonly<Record<string, number>>;
      readonly status?: MeetingReport['status'];
    },
  ): Promise<Result<MeetingReport, Error>>;

  /** Update report status. */
  updateReportStatus(
    reportId: ReportId,
    status: MeetingReport['status'],
  ): Promise<Result<MeetingReport, Error>>;

  /** Delete a report. */
  deleteReport(reportId: ReportId): Promise<Result<void, Error>>;

  /** Delete all reports for a meeting. */
  deleteReportsByMeeting(meetingId: MeetingId): Promise<Result<number, Error>>;
}

// ============================================================================
// Transcript Context Repository Port
// ============================================================================

/**
 * Transcript context repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer.
 *
 * Per `feature-ai/SPECIFICATION.md`: Transcript context repository operations.
 * Manages the rolling context window for AI processing.
 */
export interface TranscriptContextRepository {
  /** Add a segment to the context window. */
  addSegment(meetingId: MeetingId, segment: TranscriptContextSegment): Promise<Result<void, Error>>;

  /** Get the context window for a meeting. */
  getContextWindow(
    meetingId: MeetingId,
    windowMinutes?: number,
  ): Promise<Result<MeetingTranscriptContext, Error>>;

  /** Get all segments for a meeting. */
  getAllSegments(meetingId: MeetingId): Promise<Result<ReadonlyArray<TranscriptContextSegment>, Error>>;

  /** Clear the context window for a meeting. */
  clearContextWindow(meetingId: MeetingId): Promise<Result<number, Error>>;

  /** Get segment count for a meeting. */
  getSegmentCount(meetingId: MeetingId): Promise<Result<number, Error>>;
}

// ============================================================================
// AI Meeting Service Port
// ============================================================================

/**
 * AI question input.
 *
 * Per `feature-ai/SPECIFICATION.md`: AI question parameters.
 */
export interface AskAiQuestionInput {
  readonly meetingId: MeetingId;
  readonly question: string;
}

/**
 * AI meeting service port (interface).
 *
 * Per `feature-ai/SPECIFICATION.md`: the main AI service interface for
 * processing transcripts and generating AI outputs.
 */
export interface AiMeetingService {
  /** Process a transcript segment (add to context, trigger updates). */
  processTranscriptSegment(
    meetingId: MeetingId,
    segment: TranscriptContextSegment,
  ): Promise<Result<void, Error>>;

  /** Generate a running summary for a meeting. */
  generateRunningSummary(meetingId: MeetingId): Promise<Result<MeetingSummary, Error>>;

  /** Detect action items from the current context. */
  detectActionItems(meetingId: MeetingId): Promise<Result<ReadonlyArray<ActionItem>, Error>>;

  /** Answer a question using meeting context. */
  answerQuestion(input: AskAiQuestionInput): Promise<Result<string, Error>>;

  /** Generate a post-meeting report. */
  generatePostMeetingReport(meetingId: MeetingId): Promise<Result<MeetingReport, Error>>;
}