/**
 * @aimeetx/sdk — AI Assistant module.
 *
 * Per ADR-005: this is the ONLY module in the SDK that may call the Gemini
 * API for AI features (meeting summaries, action item extraction, Q&A).
 * All other SDK modules (and clients) must consume AI via the public
 * interfaces and event bus defined here.
 *
 * Architectural rules (binding):
 * - This directory is the only place (alongside `translation/`) where
 *   `@google/generative-ai` is imported.
 * - Domain types live in `../domain/model/ai.js`.
 * - The gateway implementation lives in `../data/gemini-ai-gateway.js`.
 * - This module re-exports both for ergonomic single-import consumption.
 */

export type {
  ReportStatus,
  MeetingTranscriptContext,
  TranscriptContextSegment,
  MeetingSummary,
  ActionItem,
  MeetingReport,
  GeminiAiConfig,
  AiError,
} from '../domain/model/ai.js';
export { AI_CONSTRAINTS, AI_PROMPT_TEMPLATES, DEFAULT_GEMINI_AI_CONFIG, DEFAULT_TRANSCRIPT_WINDOW_MINUTES } from '../domain/model/ai.js';

export type {
  CreateMeetingSummaryInput,
  MeetingSummaryRepository,
  CreateActionItemInput,
  ActionItemRepository,
  CreateMeetingReportInput,
  MeetingReportRepository,
  TranscriptContextRepository,
  AskAiQuestionInput,
  AiMeetingService,
} from '../domain/port/ai-repository.js';

export type {
  MeetingSummaryGeneratedEvent,
  MeetingSummaryUpdatedEvent,
  ActionItemDetectedEvent,
  ActionItemsExtractedEvent,
  MeetingReportGenerationStartedEvent,
  MeetingReportReadyEvent,
  MeetingReportFailedEvent,
  MeetingReportStatusChangedEvent,
  AiQuestionAskedEvent,
  AiQuestionAnsweredEvent,
  MeetingSummaryEvent,
  ActionItemEvent,
  MeetingReportEvent,
  AiQuestionEvent,
  AiEvent,
} from '../domain/event/ai-events.js';

export {
  ProcessTranscriptSegmentUseCase,
  GenerateRunningSummaryUseCase,
  ExtractActionItemsUseCase,
  AskAiQuestionUseCase,
  GeneratePostMeetingReportUseCase,
  GetMeetingSummaryUseCase,
  GetActionItemsUseCase,
  GetMeetingReportUseCase,
} from '../domain/usecase/ai-use-cases.js';

export { GeminiAiGateway } from '../data/gemini-ai-gateway.js';
