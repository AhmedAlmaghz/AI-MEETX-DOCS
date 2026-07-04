import { describe, expect, it } from 'vitest';

import {
  isChannelAllowed,
  NOTIFICATION_CONSTRAINTS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from './notification.js';

describe('Notification channel preferences', () => {
  it('falls back to defaults when no preferences exist', () => {
    expect(isChannelAllowed('meeting_reminder', 'push', null)).toBe(true);
    expect(isChannelAllowed('meeting_reminder', 'email', null)).toBe(true);
    expect(isChannelAllowed('meeting_started', 'push', null)).toBe(true);
    expect(isChannelAllowed('meeting_started', 'email', null)).toBe(false);
  });

  it('respects user-supplied preferences', () => {
    const prefs = {
      userId: 'user_1' as never,
      preferences: {
        meeting_reminder: ['push'] as never,
        meeting_started: [] as never,
      },
    };

    expect(isChannelAllowed('meeting_reminder', 'push', prefs)).toBe(true);
    expect(isChannelAllowed('meeting_reminder', 'email', prefs)).toBe(false);
    expect(isChannelAllowed('meeting_started', 'push', prefs)).toBe(false);
  });
});

describe('Notification constraints', () => {
  it('idempotency window is exactly 60 seconds', () => {
    expect(NOTIFICATION_CONSTRAINTS.IDEMPOTENCY_WINDOW_MS).toBe(60_000);
  });

  it('push delivery target is exactly 2 seconds', () => {
    expect(NOTIFICATION_CONSTRAINTS.PUSH_DELIVERY_TARGET_MS).toBe(2_000);
  });

  it('default page size and max are sensible', () => {
    expect(NOTIFICATION_CONSTRAINTS.DEFAULT_PAGE_SIZE).toBe(20);
    expect(NOTIFICATION_CONSTRAINTS.MAX_PAGE_SIZE).toBe(100);
  });
});

describe('Default notification preferences', () => {
  it('meeting_reminder is push+email+sms by default', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.meeting_reminder).toEqual(['push', 'email', 'sms']);
  });

  it('recording_ready is push+email by default', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.recording_ready).toEqual(['push', 'email']);
  });

  it('ai_report_ready is email only by default', () => {
    expect(DEFAULT_NOTIFICATION_PREFERENCES.ai_report_ready).toEqual(['email']);
  });
});
