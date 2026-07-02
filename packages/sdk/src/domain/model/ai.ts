import type {
  ActionItemId,
  IsoDateString,
  MeetingId,
  ReportId,
  SummaryId,
  TranslationSegmentId,
} from '@aimeetx/types';

// ============================================================================
// Report Status
// ============================================================================

/**
 * Meeting report status.
 *
 * Per `feature-ai/SPECIFICATION.md`: report lifecycle states.
 * States: GENERATING → READY | FAILED
 */
export type ReportStatus = 'generating' | 'ready' | 'failed';

// ============================================================================
// Meeting Transcript Context (Value Object)
// ============================================================================

/**
 * Meeting transcript context.
 *
 * Per `feature-ai/SPECIFICATION.md`: holds the rolling context window
 * fed to the AI for generating summaries, action items, and reports.
 */
export interface MeetingTranscriptContext {
  readonly meetingId: MeetingId;
  readonly segments: ReadonlyArray<TranscriptContextSegment>;
  readonly windowMinutes: number;
}

/**
 * Transcript context segment for AI processing.
 *
 * Per `feature-ai/SPECIFICATION.md`: simplified transcript segment
 * for AI context window.
 */
export interface TranscriptContextSegment {
  readonly segmentId: TranslationSegmentId;
  readonly speakerName: string;
  readonly text: string;
  readonly language: string;
  readonly timestamp: IsoDateString;
}

/**
 * Default transcript context window in minutes.
 */
export const DEFAULT_TRANSCRIPT_WINDOW_MINUTES = 30;

// ============================================================================
// Meeting Summary (Entity)
// ============================================================================

/**
 * Meeting summary.
 *
 * Per `feature-ai/SPECIFICATION.md`: AI-generated meeting summary.
 * Can be a running summary (updated during meeting) or final summary.
 */
export interface MeetingSummary {
  readonly id: SummaryId;
  readonly meetingId: MeetingId;
  readonly summaryText: string;
  readonly keyTopics: ReadonlyArray<string>;
  readonly generatedAt: IsoDateString;
  readonly isFinal: boolean;
}

// ============================================================================
// Action Item (Entity)
// ============================================================================

/**
 * Action item.
 *
 * Per `feature-ai/SPECIFICATION.md`: AI-detected action item from meeting.
 */
export interface ActionItem {
  readonly id: ActionItemId;
  readonly meetingId: MeetingId;
  readonly description: string;
  readonly assignedTo: string | null;
  readonly dueDate: string | null;
  readonly detectedAt: IsoDateString;
  readonly confidence: number;
}

// ============================================================================
// Meeting Report (Aggregate Root)
// ============================================================================

/**
 * Meeting report.
 *
 * Per `feature-ai/SPECIFICATION.md`: the final post-meeting deliverable
 * containing summary, decisions, action items, and topic breakdown.
 */
export interface MeetingReport {
  readonly id: ReportId;
  readonly meetingId: MeetingId;
  readonly summary: string;
  readonly decisions: ReadonlyArray<string>;
  readonly actionItems: ReadonlyArray<ActionItem>;
  readonly topicBreakdown: Readonly<Record<string, number>>;
  readonly generatedAt: IsoDateString;
  readonly status: ReportStatus;
}

// ============================================================================
// AI Configuration
// ============================================================================

/**
 * Gemini AI API configuration.
 *
 * Per `feature-ai/SPECIFICATION.md`: configuration for connecting
 * to Gemini AI API for meeting analysis.
 */
export interface GeminiAiConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly maxTokens: number;
  readonly temperature: number;
}

/**
 * Default Gemini AI configuration.
 */
export const DEFAULT_GEMINI_AI_CONFIG: Omit<GeminiAiConfig, 'apiKey'> = {
  model: 'gemini-2.0-flash-exp',
  maxTokens: 4096,
  temperature: 0.3,
} as const;

// ============================================================================
// AI Prompt Templates
// ============================================================================

/**
 * AI prompt templates.
 *
 * Per `feature-ai/SPECIFICATION.md`: prompt templates for various AI operations.
 */
export const AI_PROMPT_TEMPLATES = {
  RUNNING_SUMMARY: `You are a meeting assistant AI. You receive live transcript segments and generate a concise meeting summary.

Here is the transcript so far:
{transcriptContext}

Generate a 2-3 sentence summary of what has been discussed so far.`,

  ACTION_ITEM_DETECTION: `Extract clear action items from this meeting transcript. Return JSON.

Transcript:
{transcriptContext}

Return JSON array: [{"description": "...", "assignedTo": "...", "dueDate": "..."}]`,

  'Q&A': `You are an AI assistant in a meeting. Answer questions based on the transcript context.

Context:
{transcriptContext}

User Question: {userQuestion}`,

  POST_MEETING_REPORT: `Generate a comprehensive post-meeting report from this transcript.

Transcript:
{transcriptContext}

Return JSON with:
{
  "summary": "string",
  "decisions": ["string"],
  "actionItems": [{"description": "...", "assignedTo": "...", "dueDate": "..."}],
  "topicBreakdown": {"topic": minutesDiscussed}
}`,
} as const;

// ============================================================================
// AI Constraints
// ============================================================================

/**
 * AI constraints.
 *
 * Per `feature-ai/SPECIFICATION.md`: system limits and constraints.
 */
export const AI_CONSTRAINTS = {
  MAX_CONTEXT_SEGMENTS: 500,
  DEFAULT_WINDOW_MINUTES: 30,
  MAX_PROMPT_LENGTH: 30000,
  SUMMARY_UPDATE_INTERVAL_MS: 60000, // Update running summary every minute
  MAX_ACTION_ITEMS_PER_MEETING: 100,
  MIN_CONFIDENCE_THRESHOLD: 0.6,
} as const;

// ============================================================================
// AI Errors
// ============================================================================

/**
 * AI error types.
 *
 * Per feature-ai API specifications: error codes.
 */
export type AiError =
  | { readonly code: 'MeetingNotFound'; readonly message: string }
  | { readonly code: 'NoTranscriptAvailable'; readonly message: string }
  | { readonly code: 'AiApiError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'AiQuotaExceeded'; readonly message: string }
  | { readonly code: 'PromptTooLong'; readonly message: string; readonly maxLength: number }
  | { readonly code: 'InvalidResponse'; readonly message: string }
  | { readonly code: 'ReportNotFound'; readonly message: string }
  | { readonly code: 'ReportAlreadyGenerating'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };