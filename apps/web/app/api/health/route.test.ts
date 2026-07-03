import { describe, expect, it } from 'vitest';

import { GET } from './route.js';

describe('Health endpoint', () => {
  it('returns 200 with healthy status', async () => {
    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe('healthy');
    expect(json.service).toBe('ai-meetx-web');
    expect(json.timestamp).toBeDefined();
  });
});