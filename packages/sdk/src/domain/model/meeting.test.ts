import { describe, expect, it } from 'vitest';

import {
  canMuteOthers,
  canManageRoles,
  canAdmitOthers,
  canKickOthers,
  isPrivilegedRole,
  MEETING_CONSTRAINTS,
} from './meeting.js';

describe('Meeting permission helpers', () => {
  it('host can mute, manage roles, admit, and kick', () => {
    expect(canMuteOthers('host')).toBe(true);
    expect(canManageRoles('host')).toBe(true);
    expect(canAdmitOthers('host')).toBe(true);
    expect(canKickOthers('host')).toBe(true);
    expect(isPrivilegedRole('host')).toBe(true);
  });

  it('co_host can mute, manage roles, admit, and kick', () => {
    expect(canMuteOthers('co_host')).toBe(true);
    expect(canManageRoles('co_host')).toBe(true);
    expect(canAdmitOthers('co_host')).toBe(true);
    expect(canKickOthers('co_host')).toBe(true);
    expect(isPrivilegedRole('co_host')).toBe(true);
  });

  it('moderator can mute, admit, and kick but not manage roles', () => {
    expect(canMuteOthers('moderator')).toBe(true);
    expect(canManageRoles('moderator')).toBe(false);
    expect(canAdmitOthers('moderator')).toBe(true);
    expect(canKickOthers('moderator')).toBe(true);
    expect(isPrivilegedRole('moderator')).toBe(false);
  });

  it('speaker cannot manage others but can speak', () => {
    expect(canMuteOthers('speaker')).toBe(false);
    expect(canManageRoles('speaker')).toBe(false);
    expect(canAdmitOthers('speaker')).toBe(false);
    expect(canKickOthers('speaker')).toBe(false);
  });

  it('attendee cannot manage others at all', () => {
    expect(canMuteOthers('attendee')).toBe(false);
    expect(canManageRoles('attendee')).toBe(false);
    expect(canAdmitOthers('attendee')).toBe(false);
    expect(canKickOthers('attendee')).toBe(false);
  });
});

describe('Meeting constraints', () => {
  it('defines expected capacity limits', () => {
    expect(MEETING_CONSTRAINTS.MAX_PARTICIPANTS_DEFAULT).toBe(100);
    expect(MEETING_CONSTRAINTS.MAX_PARTICIPANTS_LIMIT).toBe(500);
    expect(MEETING_CONSTRAINTS.MAX_TITLE_LENGTH).toBe(256);
    expect(MEETING_CONSTRAINTS.MIN_DURATION_MINUTES).toBe(5);
  });
});
