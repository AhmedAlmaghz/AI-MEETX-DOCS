import { describe, expect, it } from 'vitest';

import { WHITEBOARD_CONSTRAINTS } from './whiteboard.js';

describe('Whiteboard constraints', () => {
  it('caps strokes and points per stroke to prevent abuse', () => {
    expect(WHITEBOARD_CONSTRAINTS.MAX_STROKES).toBe(10_000);
    expect(WHITEBOARD_CONSTRAINTS.MAX_POINTS_PER_STROKE).toBe(5_000);
  });

  it('line width range is 1-50', () => {
    expect(WHITEBOARD_CONSTRAINTS.MIN_LINE_WIDTH).toBe(1);
    expect(WHITEBOARD_CONSTRAINTS.MAX_LINE_WIDTH).toBe(50);
    expect(WHITEBOARD_CONSTRAINTS.MAX_LINE_WIDTH).toBeGreaterThan(WHITEBOARD_CONSTRAINTS.MIN_LINE_WIDTH);
  });

  it('throttle targets 60fps (16ms per frame)', () => {
    expect(WHITEBOARD_CONSTRAINTS.THROTTLE_MS).toBe(16);
  });
});
