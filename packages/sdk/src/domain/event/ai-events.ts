import type {
  ActionItemId,
  DomainEvent,
  IsoDateString,
  MeetingId,
  ReportId,
  SummaryId,
} from '@aimeetx/types';

import type { ReportStatus } from '../model/ai.js';

// ============================================================================
// Meeting Summary Events
// ============================================================================

/**
 * MeetingSummaryGeneratedEvent — published when a meeting summary is generated.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered after AI generates summary.
 */
export interface MeetingSummaryGeneratedEvent extends DomainEvent {
  readonly eventType: 'MeetingSummaryGenerated';
  readonly payload: {
    readonly summaryId: SummaryId;
    readonly meetingId: MeetingId;
    readonly isFinal: boolean;
    readonly keyTopics: ReadonlyArray<string>;
    readonly generatedAt: IsoDateString;
  };
}

/**
 * MeetingSummaryUpdatedEvent — published when a running summary is updated.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered when running summary is refreshed.
 */
export interface MeetingSummaryUpdatedEvent extends DomainEvent {
  readonly eventType: 'MeetingSummaryUpdated';
  readonly payload: {
    readonly summaryId: SummaryId;
    readonly meetingId: MeetingId;
    readonly previousTopicCount: number;
    readonly newTopicCount: number;
    readonly updatedAt: IsoDateString;
  };
}

// ============================================================================
// Action Item Events
// ============================================================================

/**
 * ActionItemDetectedEvent — published when an action item is detected.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered after AI detects action item.
 */
export interface ActionItemDetectedEvent extends DomainEvent {
  readonly eventType: 'ActionItemDetected';
  readonly payload: {
    readonly actionItemId: ActionItemId;
    readonly meetingId: MeetingId;
    readonly description: string;
    readonly assignedTo: string | null;
    readonly dueDate: string | null;
    readonly confidence: number;
    readonly detectedAt: IsoDateString;
  };
}

/**
 * ActionItemsExtractedEvent — published when action items are extracted in batch.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered after batch action item extraction.
 */
export interface ActionItemsExtractedEvent extends DomainEvent {
  readonly eventType: 'ActionItemsExtracted';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly actionItemIds: ReadonlyArray<ActionItemId>;
    readonly count: number;
    readonly extractedAt: IsoDateString;
  };
}

// ============================================================================
// Meeting Report Events
// ============================================================================

/**
 * MeetingReportGenerationStartedEvent — published when report generation begins.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered at start of report generation.
 */
export interface MeetingReportGenerationStartedEvent extends DomainEvent {
  readonly eventType: 'MeetingReportGenerationStarted';
  readonly payload: {
    readonly reportId: ReportId;
    readonly meetingId: MeetingId;
    readonly startedAt: IsoDateString;
  };
}

/**
 * MeetingReportReadyEvent — published when report is ready.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered after successful report generation.
 */
export interface MeetingReportReadyEvent extends DomainEvent {
  readonly eventType: 'MeetingReportReady';
  readonly payload: {
    readonly reportId: ReportId;
    readonly meetingId: MeetingId;
    readonly actionItemCount: number;
    readonly decisionCount: number;
    readonly topicCount: number;
    readonly generatedAt: IsoDateString;
  };
}

/**
 * MeetingReportFailedEvent — published when report generation fails.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered on report generation failure.
 */
export interface MeetingReportFailedEvent extends DomainEvent {
  readonly eventType: 'MeetingReportFailed';
  readonly payload: {
    readonly reportId: ReportId;
    readonly meetingId: MeetingId;
    readonly errorMessage: string;
    readonly failedAt: IsoDateString;
  };
}

/**
 * MeetingReportStatusChangedEvent — published when report status changes.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered on report status transitions.
 */
export interface MeetingReportStatusChangedEvent extends DomainEvent {
  readonly eventType: 'MeetingReportStatusChanged';
  readonly payload: {
    readonly reportId: ReportId;
    readonly meetingId: MeetingId;
    readonly previousStatus: ReportStatus;
    readonly newStatus: ReportStatus;
    readonly changedAt: IsoDateString;
  };
}

// ============================================================================
// AI Q&A Events
// ============================================================================

/**
 * AiQuestionAskedEvent — published when a user asks the AI a question.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered when user submits question.
 */
export interface AiQuestionAskedEvent extends DomainEvent {
  readonly eventType: 'AiQuestionAsked';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly question: string;
    readonly askedAt: IsoDateString;
  };
}

/**
 * AiQuestionAnsweredEvent — published when the AI answers a question.
 *
 * Per `feature-ai/SPECIFICATION.md`: triggered after AI generates answer.
 */
export interface AiQuestionAnsweredEvent extends DomainEvent {
  readonly eventType: 'AiQuestionAnswered';
  readonly payload: {
    readonly meetingId: MeetingId;
    readonly question: string;
    readonly answerLength: number;
    readonly answeredAt: IsoDateString;
  };
}

// ============================================================================
// Event Union Types
// ============================================================================

/**
 * Union of all meeting summary events.
 */
export type MeetingSummaryEvent =
  | MeetingSummaryGeneratedEvent
  | MeetingSummaryUpdatedEvent;

/**
 * Union of all action item events.
 */
export type ActionItemEvent =
  | ActionItemDetectedEvent
  | ActionItemsExtractedEvent;

/**
 * Union of all meeting report events.
 */
export type MeetingReportEvent =
  | MeetingReportGenerationStartedEvent
  | MeetingReportReadyEvent
  | MeetingReportFailedEvent
  | MeetingReportStatusChangedEvent;

/**
 * Union of all AI Q&A events.
 */
export type AiQuestionEvent =
  | AiQuestionAskedEvent
  | AiQuestionAnsweredEvent;

/**
 * Union of all AI-related domain events.
 */
export type AiEvent =
  | MeetingSummaryEvent
  | ActionItemEvent
  | MeetingReportEvent
  | AiQuestionEvent;