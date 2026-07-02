import type { Result, MeetingId } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type {
  ActionItem,
  GeminiAiConfig,
  MeetingReport,
  MeetingSummary,
  MeetingTranscriptContext,
  TranscriptContextSegment,
} from '../domain/model/ai.js';
import { AI_CONSTRAINTS, AI_PROMPT_TEMPLATES, DEFAULT_GEMINI_AI_CONFIG } from '../domain/model/ai.js';
import type { AiMeetingService, AskAiQuestionInput } from '../domain/port/ai-repository.js';

// ============================================================================
// Gemini AI Gateway
// ============================================================================

/**
 * Gemini AI Gateway.
 *
 * Per `feature-ai/SPECIFICATION.md`: handles REST API calls to Gemini AI
 * for meeting analysis (summaries, action items, reports, Q&A).
 */
export class GeminiAiGateway implements AiMeetingService {
  private readonly config: Omit<GeminiAiConfig, 'apiKey'>;
  private readonly apiKey: string;

  constructor(apiKey: string, config?: Partial<Omit<GeminiAiConfig, 'apiKey'>>) {
    this.apiKey = apiKey;
    this.config = { ...DEFAULT_GEMINI_AI_CONFIG, ...config };
  }

  /**
   * Process a transcript segment.
   */
  async processTranscriptSegment(
    _meetingId: MeetingId,
    _segment: TranscriptContextSegment,
  ): Promise<Result<void, Error>> {
    // This is handled by the TranscriptContextRepository
    // The AI service just coordinates the processing
    return success(undefined);
  }

  /**
   * Generate a running summary.
   */
  async generateRunningSummary(_meetingId: MeetingId): Promise<Result<MeetingSummary, Error>> {
    // This would be called with the context from TranscriptContextRepository
    // For now, return a placeholder
    return failure(new Error('Context must be provided via processTranscriptSegment'));
  }

  /**
   * Detect action items.
   */
  async detectActionItems(_meetingId: MeetingId): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    return failure(new Error('Context must be provided via processTranscriptSegment'));
  }

  /**
   * Answer a question.
   */
  async answerQuestion(_input: AskAiQuestionInput): Promise<Result<string, Error>> {
    return failure(new Error('Not implemented - requires context repository integration'));
  }

  /**
   * Generate a post-meeting report.
   */
  async generatePostMeetingReport(_meetingId: MeetingId): Promise<Result<MeetingReport, Error>> {
    return failure(new Error('Not implemented - requires context repository integration'));
  }

  /**
   * Generate summary from context.
   */
  async generateSummaryFromContext(
    context: MeetingTranscriptContext,
  ): Promise<Result<string, Error>> {
    const prompt = this.buildPrompt(AI_PROMPT_TEMPLATES.RUNNING_SUMMARY, {
      transcriptContext: this.formatTranscriptContext(context.segments),
    });

    return this.callGeminiApi(prompt);
  }

  /**
   * Extract action items from context.
   */
  async extractActionItemsFromContext(
    context: MeetingTranscriptContext,
  ): Promise<Result<ReadonlyArray<ActionItem>, Error>> {
    const prompt = this.buildPrompt(AI_PROMPT_TEMPLATES.ACTION_ITEM_DETECTION, {
      transcriptContext: this.formatTranscriptContext(context.segments),
    });

    const result = await this.callGeminiApi(prompt);
    if (result.isFailure) return result;

    try {
      const items = JSON.parse(result.value) as Array<{
        description: string;
        assignedTo: string | null;
        dueDate: string | null;
      }>;

      const actionItems: ActionItem[] = items.map((item, index) => ({
        id: `action-${Date.now()}-${index}` as ActionItem['id'],
        meetingId: context.meetingId,
        description: item.description,
        assignedTo: item.assignedTo,
        dueDate: item.dueDate,
        detectedAt: new Date().toISOString() as ActionItem['detectedAt'],
        confidence: 0.8,
      }));

      return success(actionItems);
    } catch {
      return failure(new Error('Failed to parse action items response'));
    }
  }

  /**
   * Answer question from context.
   */
  async answerQuestionFromContext(
    context: MeetingTranscriptContext,
    question: string,
  ): Promise<Result<string, Error>> {
    const prompt = this.buildPrompt(AI_PROMPT_TEMPLATES['Q&A'], {
      transcriptContext: this.formatTranscriptContext(context.segments),
      userQuestion: question,
    });

    return this.callGeminiApi(prompt);
  }

  /**
   * Generate post-meeting report from context.
   */
  async generateReportFromContext(
    context: MeetingTranscriptContext,
  ): Promise<Result<MeetingReport, Error>> {
    const prompt = this.buildPrompt(AI_PROMPT_TEMPLATES.POST_MEETING_REPORT, {
      transcriptContext: this.formatTranscriptContext(context.segments),
    });

    const result = await this.callGeminiApi(prompt);
    if (result.isFailure) return result;

    try {
      const report = JSON.parse(result.value) as {
        summary: string;
        decisions: string[];
        actionItems: Array<{
          description: string;
          assignedTo: string | null;
          dueDate: string | null;
        }>;
        topicBreakdown: Record<string, number>;
      };

      const meetingReport: MeetingReport = {
        id: `report-${Date.now()}` as MeetingReport['id'],
        meetingId: context.meetingId,
        summary: report.summary,
        decisions: report.decisions,
        actionItems: report.actionItems.map((item, index) => ({
          id: `action-${Date.now()}-${index}` as ActionItem['id'],
          meetingId: context.meetingId,
          description: item.description,
          assignedTo: item.assignedTo,
          dueDate: item.dueDate,
          detectedAt: new Date().toISOString() as ActionItem['detectedAt'],
          confidence: 0.8,
        })),
        topicBreakdown: report.topicBreakdown,
        generatedAt: new Date().toISOString() as MeetingReport['generatedAt'],
        status: 'ready',
      };

      return success(meetingReport);
    } catch {
      return failure(new Error('Failed to parse report response'));
    }
  }

  // ==========================================================================
  // Private methods
  // ==========================================================================

  private buildPrompt(
    template: string,
    variables: Record<string, string>,
  ): string {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(`{${key}}`, value);
    }
    return prompt;
  }

  private formatTranscriptContext(segments: ReadonlyArray<TranscriptContextSegment>): string {
    // Limit to max context segments
    const limitedSegments = segments.slice(-AI_CONSTRAINTS.MAX_CONTEXT_SEGMENTS);

    return limitedSegments
      .map((s) => `[${s.timestamp}] ${s.speakerName}: ${s.text}`)
      .join('\n');
  }

  private async callGeminiApi(prompt: string): Promise<Result<string, Error>> {
    // Validate prompt length
    if (prompt.length > AI_CONSTRAINTS.MAX_PROMPT_LENGTH) {
      return failure(
        new Error(`Prompt length (${prompt.length}) exceeds maximum (${AI_CONSTRAINTS.MAX_PROMPT_LENGTH})`),
      );
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: this.config.maxTokens,
              temperature: this.config.temperature,
            },
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return failure(
          new Error(`Gemini API error: ${response.status} - ${(error as Record<string, unknown>)?.message || 'Unknown error'}`),
        );
      }

      const data = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return failure(new Error('No response from Gemini API'));
      }

      return success(text);
    } catch (error) {
      return failure(error instanceof Error ? error : new Error('Gemini API call failed'));
    }
  }
}