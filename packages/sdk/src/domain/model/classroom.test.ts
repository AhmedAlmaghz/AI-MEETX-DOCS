import { describe, expect, it } from 'vitest';

import { CLASSROOM_CONSTRAINTS } from './classroom.js';

describe('Classroom constraints', () => {
  it('quiz question length is 1-1000', () => {
    expect(CLASSROOM_CONSTRAINTS.MIN_QUESTION_LENGTH).toBe(1);
    expect(CLASSROOM_CONSTRAINTS.MAX_QUESTION_LENGTH).toBe(1000);
  });

  it('option text length is 1-500', () => {
    expect(CLASSROOM_CONSTRAINTS.MIN_OPTION_TEXT_LENGTH).toBe(1);
    expect(CLASSROOM_CONSTRAINTS.MAX_OPTION_TEXT_LENGTH).toBe(500);
  });

  it('quizzes must have 2-10 options', () => {
    expect(CLASSROOM_CONSTRAINTS.MIN_OPTIONS).toBe(2);
    expect(CLASSROOM_CONSTRAINTS.MAX_OPTIONS).toBe(10);
    expect(CLASSROOM_CONSTRAINTS.MAX_OPTIONS).toBeGreaterThan(CLASSROOM_CONSTRAINTS.MIN_OPTIONS);
  });

  it('breakout rooms must be 2-20', () => {
    expect(CLASSROOM_CONSTRAINTS.MIN_BREAKOUT_ROOMS).toBe(2);
    expect(CLASSROOM_CONSTRAINTS.MAX_BREAKOUT_ROOMS).toBe(20);
  });

  it('breakout room name length is 1-128', () => {
    expect(CLASSROOM_CONSTRAINTS.MIN_ROOM_NAME_LENGTH).toBe(1);
    expect(CLASSROOM_CONSTRAINTS.MAX_ROOM_NAME_LENGTH).toBe(128);
  });
});
