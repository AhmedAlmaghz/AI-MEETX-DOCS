import { describe, expect, it } from 'vitest';

import {
  isRecordingActive,
  isRecordingTerminal,
  canManageRecording,
  RECORDING_CONSTRAINTS,
} from './recording.js';

describe('Recording status helpers', () => {
  it('starting, active, stopping are considered active', () => {
    expect(isRecordingActive('starting')).toBe(true);
    expect(isRecordingActive('active')).toBe(true);
    expect(isRecordingActive('stopping')).toBe(true);
    expect(isRecordingActive('ready')).toBe(false);
    expect(isRecordingActive('failed')).toBe(false);
    expect(isRecordingActive('expired')).toBe(false);
  });

  it('ready, failed, expired are terminal states', () => {
    expect(isRecordingTerminal('ready')).toBe(true);
    expect(isRecordingTerminal('failed')).toBe(true);
    expect(isRecordingTerminal('expired')).toBe(true);
    expect(isRecordingTerminal('starting')).toBe(false);
    expect(isRecordingTerminal('active')).toBe(false);
  });
});

describe('Recording permission helpers', () => {
  it('only host and co_host can manage recordings', () => {
    expect(canManageRecording('host')).toBe(true);
    expect(canManageRecording('co_host')).toBe(true);
    expect(canManageRecording('moderator')).toBe(false);
    expect(canManageRecording('speaker')).toBe(false);
    expect(canManageRecording('attendee')).toBe(false);
  });
});

describe('Recording constraints', () => {
  it('download link expires in 1-72 hours', () => {
    expect(RECORDING_CONSTRAINTS.MAX_DOWNLOAD_LINK_HOURS).toBe(72);
    expect(RECORDING_CONSTRAINTS.DEFAULT_DOWNLOAD_LINK_HOURS).toBe(24);
  });

  it('retention default is 30 days', () => {
    expect(RECORDING_CONSTRAINTS.DEFAULT_RETENTION_DAYS).toBe(30);
  });
});
