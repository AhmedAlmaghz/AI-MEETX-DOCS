import { describe, expect, it } from 'vitest';

import { AI_CONSTRAINTS, AI_PROMPT_TEMPLATES, DEFAULT_GEMINI_AI_CONFIG, DEFAULT_TRANSCRIPT_WINDOW_MINUTES } from './ai.js';

describe('AI constraints', () => {
  it('caps context segments at 500', () => {
    expect(AI_CONSTRAINTS.MAX_CONTEXT_SEGMENTS).toBe(500);
  });

  it('uses 30-min default transcript window', () => {
    expect(AI_CONSTRAINTS.DEFAULT_WINDOW_MINUTES).toBe(30);
    expect(DEFAULT_TRANSCRIPT_WINDOW_MINUTES).toBe(30);
  });

  it('caps prompt length at 30K characters', () => {
    expect(AI_CONSTRAINTS.MAX_PROMPT_LENGTH).toBe(30_000);
  });

  it('runs running summary every 60s', () => {
    expect(AI_CONSTRAINTS.SUMMARY_UPDATE_INTERVAL_MS).toBe(60_000);
  });

  it('caps action items at 100 per meeting', () => {
    expect(AI_CONSTRAINTS.MAX_ACTION_ITEMS_PER_MEETING).toBe(100);
  });

  it('confidence threshold is at least 0.6 (avoid hallucination)', () => {
    expect(AI_CONSTRAINTS.MIN_CONFIDENCE_THRESHOLD).toBeGreaterThanOrEqual(0.6);
  });
});

describe('Default Gemini AI config', () => {
  it('uses a sensible default model', () => {
    expect(DEFAULT_GEMINI_AI_CONFIG.model).toBeTruthy();
    expect(typeof DEFAULT_GEMINI_AI_CONFIG.model).toBe('string');
  });

  it('uses a safe default temperature (not too creative)', () => {
    expect(DEFAULT_GEMINI_AI_CONFIG.temperature).toBeLessThanOrEqual(0.5);
  });

  it('caps max tokens at a reasonable limit', () => {
    expect(DEFAULT_GEMINI_AI_CONFIG.maxTokens).toBeGreaterThan(0);
    expect(DEFAULT_GEMINI_AI_CONFIG.maxTokens).toBeLessThanOrEqual(8192);
  });
});

describe('Prompt templates', () => {
  it('all prompts contain a transcript context placeholder', () => {
    expect(AI_PROMPT_TEMPLATES.RUNNING_SUMMARY).toContain('{transcriptContext}');
    expect(AI_PROMPT_TEMPLATES.ACTION_ITEM_DETECTION).toContain('{transcriptContext}');
    expect(AI_PROMPT_TEMPLATES['Q&A']).toContain('{transcriptContext}');
    expect(AI_PROMPT_TEMPLATES.POST_MEETING_REPORT).toContain('{transcriptContext}');
  });

  it('Q&A template includes a question placeholder', () => {
    expect(AI_PROMPT_TEMPLATES['Q&A']).toContain('{userQuestion}');
  });
});
