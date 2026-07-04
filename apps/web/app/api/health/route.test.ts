import { describe, expect, it } from 'vitest';

import { GET } from './route.js';

describe('Health endpoint', () => {
  it('returns 200 with healthy status', async () => {
    const response = GET();
    const json = (await response.json()) as {
      status: string;
      service: string;
      timestamp: string;
    };

    expect(response.status).toBe(200);
    expect(json.status).toBe('healthy');
    expect(json.service).toBe('ai-meetx-web');
    expect(json.timestamp).toBeDefined();
  });
});