import { describe, expect, it } from 'vitest';

import { TRANSLATION_CONSTRAINTS } from './translation.js';

describe('Translation constraints (per ADR-001)', () => {
  it('caps at 10 sessions per meeting (per language, not per participant)', () => {
    expect(TRANSLATION_CONSTRAINTS.MAX_SESSIONS_PER_MEETING).toBe(10);
  });

  it('auto-reconnect uses exponential backoff capped at 8s', () => {
    expect(TRANSLATION_CONSTRAINTS.RECONNECT_BASE_DELAY_MS).toBe(1_000);
    expect(TRANSLATION_CONSTRAINTS.RECONNECT_MAX_DELAY_MS).toBe(8_000);
  });

  it('translates 16kHz 16-bit mono PCM audio', () => {
    expect(TRANSLATION_CONSTRAINTS.AUDIO_SAMPLE_RATE).toBe(16_000);
    expect(TRANSLATION_CONSTRAINTS.AUDIO_BIT_DEPTH).toBe(16);
    expect(TRANSLATION_CONSTRAINTS.AUDIO_CHANNELS).toBe(1);
  });

  it('target translation latency under 800ms (per ADR-001)', () => {
    expect(TRANSLATION_CONSTRAINTS.TARGET_TRANSLATION_LATENCY_MS).toBe(800);
  });

  it('target transcript latency under 1.2s', () => {
    expect(TRANSLATION_CONSTRAINTS.TARGET_TRANSCRIPT_LATENCY_MS).toBe(1_200);
  });

  it('heartbeat every 30s and session timeout after 5min', () => {
    expect(TRANSLATION_CONSTRAINTS.HEARTBEAT_INTERVAL_MS).toBe(30_000);
    expect(TRANSLATION_CONSTRAINTS.SESSION_TIMEOUT_MS).toBe(300_000);
  });

  it('audio chunk size fits 1 second of PCM at native sample rate', () => {
    expect(TRANSLATION_CONSTRAINTS.MAX_AUDIO_CHUNK_SIZE_BYTES).toBe(32_000);
  });
});
