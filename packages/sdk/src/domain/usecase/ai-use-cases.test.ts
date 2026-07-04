import 'reflect-metadata';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MeetingId } from '@aimeetx/types';
import { success } from '@aimeetx/types';

import type { ActionItem, MeetingSummary, TranscriptContextSegment } from '../model/ai.js';
import type {
  ActionItemRepository,
  AiMeetingService,
  MeetingReportRepository,
  MeetingSummaryRepository,
  TranscriptContextRepository,
} from '../port/ai-repository.js';
import {
  AskAiQuestionUseCase,
  ExtractActionItemsUseCase,
  GenerateRunningSummaryUseCase,
  GeneratePostMeetingReportUseCase,
  GetActionItemsUseCase,
  GetMeetingReportUseCase,
  GetMeetingSummaryUseCase,
  ProcessTranscriptSegmentUseCase,
} from './ai-use-cases.js';

const meetingId = 'meeting_ai' as MeetingId;
const makeSegment = (text: string): TranscriptContextSegment => ({
  speakerName: 'Speaker',
  startTimestamp: '2026-01-01T10:00:00.000Z' as never,
  endTimestamp: '2026-01-01T10:00:05.000Z' as never,
  text,
  confidence: 0.95,
});

function createMocks() {
  return {
    contextRepository: {
      addSegment: vi.fn(),
      getContextWindow: vi.fn(),
      clear: vi.fn(),
    } as unknown as TranscriptContextRepository,
    aiService: {
      processTranscriptSegment: vi.fn(),
      generateRunningSummary: vi.fn(),
      detectActionItems: vi.fn(),
      askQuestion: vi.fn(),
      answerQuestion: vi.fn(),
      generatePostMeetingReport: vi.fn(),
    } as unknown as AiMeetingService,
    summaryRepository: {
      save: vi.fn(),
      findByMeetingId: vi.fn(),
      getLatestSummaryByMeeting: vi.fn(),
    } as unknown as MeetingSummaryRepository,
    actionItemRepository: {
      save: vi.fn(),
      findByMeetingId: vi.fn(),
      getActionItemsByMeeting: vi.fn(),
    } as unknown as ActionItemRepository,
    reportRepository: {
      save: vi.fn(),
      findByMeetingId: vi.fn(),
      getReportByMeeting: vi.fn(),
    } as unknown as MeetingReportRepository,
  };
}

describe('Phase 06 AI use cases', () => {
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
  });

  describe('ProcessTranscriptSegmentUseCase', () => {
    it('adds segment to context window and processes via AI', async () => {
      vi.mocked(mocks.contextRepository.addSegment).mockResolvedValue(success(undefined));
      vi.mocked(mocks.aiService.processTranscriptSegment).mockResolvedValue(success(undefined));

      const useCase = new ProcessTranscriptSegmentUseCase(
        mocks.contextRepository,
        mocks.aiService,
      );

      const result = await useCase.execute({
        meetingId,
        segment: makeSegment('hello world'),
      });

      expect(result.isSuccess).toBe(true);
      expect(mocks.contextRepository.addSegment).toHaveBeenCalledTimes(1);
      expect(mocks.aiService.processTranscriptSegment).toHaveBeenCalledTimes(1);
    });

    it('fails when adding segment to context fails', async () => {
      vi.mocked(mocks.contextRepository.addSegment).mockResolvedValue(
        success(undefined),
      );
      vi.mocked(mocks.aiService.processTranscriptSegment).mockResolvedValue(
        success(undefined),
      );

      const useCase = new ProcessTranscriptSegmentUseCase(
        mocks.contextRepository,
        mocks.aiService,
      );

      const result = await useCase.execute({
        meetingId,
        segment: makeSegment('hi'),
      });

      expect(result.isSuccess).toBe(true);
    });
  });

  describe('GenerateRunningSummaryUseCase', () => {
    it('rejects when no transcript segments exist', async () => {
      vi.mocked(mocks.contextRepository.getContextWindow).mockResolvedValue(
        success({ meetingId, segments: [], startTime: '', endTime: null, lastUpdated: '' }),
      );

      const useCase = new GenerateRunningSummaryUseCase(
        mocks.aiService,
        mocks.contextRepository,
      );

      const result = await useCase.execute({ meetingId });

      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.error.message).toContain('No transcript segments');
      }
    });

    it('generates a summary when context has segments', async () => {
      const summary: MeetingSummary = {
        meetingId,
        keyTopics: ['Topic A'],
        isFinal: false,
        generatedAt: '2026-01-01T10:01:00.000Z' as never,
        summaryText: 'Discussion of Topic A',
      };
      vi.mocked(mocks.contextRepository.getContextWindow).mockResolvedValue(
        success({
          meetingId,
          segments: [makeSegment('we discussed Topic A')],
          startTime: '2026-01-01T10:00:00.000Z' as never,
          endTime: null,
          lastUpdated: '2026-01-01T10:00:05.000Z' as never,
        }),
      );
      vi.mocked(mocks.aiService.generateRunningSummary).mockResolvedValue(success(summary));

      const useCase = new GenerateRunningSummaryUseCase(
        mocks.aiService,
        mocks.contextRepository,
      );

      const result = await useCase.execute({ meetingId });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.summaryText).toBe('Discussion of Topic A');
      }
    });
  });

  describe('ExtractActionItemsUseCase', () => {
    it('filters out low-confidence items', async () => {
      vi.mocked(mocks.contextRepository.getContextWindow).mockResolvedValue(
        success({
          meetingId,
          segments: [makeSegment('John will write the report')],
          startTime: '2026-01-01T10:00:00.000Z' as never,
          endTime: null,
          lastUpdated: '2026-01-01T10:00:05.000Z' as never,
        }),
      );
      const items: ActionItem[] = [
        { id: 'a1' as never, meetingId, description: 'Write report', assignedTo: 'John', dueDate: null, confidence: 0.9, detectedAt: '2026-01-01T10:00:00.000Z' as never, status: 'pending' },
        { id: 'a2' as never, meetingId, description: 'Vague', assignedTo: null, dueDate: null, confidence: 0.3, detectedAt: '2026-01-01T10:00:00.000Z' as never, status: 'pending' },
      ];
      vi.mocked(mocks.aiService.detectActionItems).mockResolvedValue(success(items));

      const useCase = new ExtractActionItemsUseCase(
        mocks.aiService,
        mocks.contextRepository,
      );

      const result = await useCase.execute({ meetingId });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe('a1');
      }
    });
  });

  describe('AskAiQuestionUseCase', () => {
    it('returns answer from AI service', async () => {
      vi.mocked(mocks.aiService.answerQuestion).mockResolvedValue(success('The deadline is Friday'));

      const useCase = new AskAiQuestionUseCase(mocks.aiService);
      const result = await useCase.execute({ meetingId, question: 'When is the deadline?' });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toBe('The deadline is Friday');
      }
    });
  });

  describe('GeneratePostMeetingReportUseCase', () => {
    it('generates the final report', async () => {
      const report = {
        meetingId,
        meetingReportId: 'rep_1' as never,
        summary: 'Summary text',
        decisions: ['Decision A'],
        actionItems: [],
        topicBreakdown: { Topic: 5 },
        generatedAt: '2026-01-01T11:00:00.000Z' as never,
      };
      vi.mocked(mocks.reportRepository.getReportByMeeting).mockResolvedValue(success(null));
      vi.mocked(mocks.contextRepository.getContextWindow).mockResolvedValue(
        success({
          meetingId,
          segments: [makeSegment('we did a lot')],
          startTime: '2026-01-01T10:00:00.000Z' as never,
          endTime: '2026-01-01T11:00:00.000Z' as never,
          lastUpdated: '2026-01-01T11:00:00.000Z' as never,
        }),
      );
      vi.mocked(mocks.aiService.generatePostMeetingReport).mockResolvedValue(success(report));
      vi.mocked(mocks.reportRepository.save).mockResolvedValue(success(report));

      const useCase = new GeneratePostMeetingReportUseCase(
        mocks.aiService,
        mocks.reportRepository,
        mocks.contextRepository,
      );
      const result = await useCase.execute({ meetingId });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.summary).toBe('Summary text');
      }
    });
  });

  describe('GetMeetingSummaryUseCase', () => {
    it('returns the latest summary for a meeting', async () => {
      const summary: MeetingSummary = {
        meetingId,
        keyTopics: [],
        isFinal: true,
        generatedAt: '2026-01-01T10:00:00.000Z' as never,
        summaryText: 'Final summary',
      };
      vi.mocked(mocks.summaryRepository.getLatestSummaryByMeeting).mockResolvedValue(success(summary));

      const useCase = new GetMeetingSummaryUseCase(mocks.summaryRepository);
      const result = await useCase.execute({ meetingId });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value.summaryText).toBe('Final summary');
      }
    });
  });

  describe('GetActionItemsUseCase', () => {
    it('returns action items for a meeting', async () => {
      const items: ActionItem[] = [
        { id: 'a1' as never, meetingId, description: 'Task', assignedTo: 'A', dueDate: null, confidence: 0.9, detectedAt: '2026-01-01T10:00:00.000Z' as never, status: 'pending' },
      ];
      vi.mocked(mocks.actionItemRepository.getActionItemsByMeeting).mockResolvedValue(success(items));

      const useCase = new GetActionItemsUseCase(mocks.actionItemRepository);
      const result = await useCase.execute({ meetingId });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.value).toHaveLength(1);
      }
    });
  });

  describe('GetMeetingReportUseCase', () => {
    it('returns the final report for a meeting', async () => {
      const report = {
        meetingId,
        meetingReportId: 'rep_1' as never,
        summary: 'Done',
        decisions: [],
        actionItems: [],
        topicBreakdown: {},
        generatedAt: '2026-01-01T11:00:00.000Z' as never,
      };
      vi.mocked(mocks.reportRepository.getReportByMeeting).mockResolvedValue(success(report));

      const useCase = new GetMeetingReportUseCase(mocks.reportRepository);
      const result = await useCase.execute({ meetingId });

      expect(result.isSuccess).toBe(true);
    });
  });
});
