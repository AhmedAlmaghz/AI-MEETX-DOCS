import { describe, expect, it, beforeEach, vi } from 'vitest';

import { FetchHttpClient } from './http-client.js';

describe('FetchHttpClient', () => {
  let client: FetchHttpClient;

  beforeEach(() => {
    client = new FetchHttpClient({ Authorization: 'Bearer test' });
  });

  it('makes a GET request and returns parsed JSON on success', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ id: 1, name: 'test' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await client.get<{ id: number; name: string }>('https://api.test.com/data');

    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.id).toBe(1);
      expect(result.value.name).toBe('test');
    }
  });

  it('returns HttpStatus error for non-2xx responses', async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ error: 'not found' }),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

    const result = await client.get('https://api.test.com/missing');

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe('HttpStatus');
      expect(result.error.status).toBe(404);
    }
  });

  it('returns NetworkError when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

    const result = await client.get('https://api.test.com/data');

    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe('NetworkError');
    }
  });

  it('sends POST with JSON body', async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      statusText: 'Created',
      json: () => Promise.resolve({ id: 2 }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    await client.post('https://api.test.com/create', { name: 'new' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    const options = callArgs[1];
    expect(options.method).toBe('POST');
    expect(options.body).toBe(JSON.stringify({ name: 'new' }));
  });

  it('applies request interceptors', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ ok: true }),
    };
    const fetchMock = vi.fn().mockResolvedValue(mockResponse);
    vi.stubGlobal('fetch', fetchMock);

    client.useRequestInterceptor((config) => ({
      ...config,
      headers: { ...config.headers, 'X-Custom': 'intercepted' },
    }));

    await client.get('https://api.test.com/data');

    const callArgs = fetchMock.mock.calls[0] as [string, RequestInit];
    const options = callArgs[1];
    expect(options.headers['X-Custom']).toBe('intercepted');
  });
});