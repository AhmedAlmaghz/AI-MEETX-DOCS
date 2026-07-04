import { describe, expect, it } from 'vitest';

import { AVATAR_CONSTRAINTS } from './profile.js';

describe('Profile domain', () => {
  it('avatar max size is 10 MB', () => {
    expect(AVATAR_CONSTRAINTS.MAX_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });

  it('avatar supported formats are PNG, JPEG, WEBP only', () => {
    expect(AVATAR_CONSTRAINTS.SUPPORTED_FORMATS).toEqual(['image/png', 'image/jpeg', 'image/webp']);
  });

  it('display name length is 3-50 characters', () => {
    expect(AVATAR_CONSTRAINTS.MIN_DISPLAY_NAME_LENGTH).toBe(3);
    expect(AVATAR_CONSTRAINTS.MAX_DISPLAY_NAME_LENGTH).toBe(50);
  });

  it('display name range is sensible (max >= min)', () => {
    expect(AVATAR_CONSTRAINTS.MAX_DISPLAY_NAME_LENGTH).toBeGreaterThan(AVATAR_CONSTRAINTS.MIN_DISPLAY_NAME_LENGTH);
  });
});
