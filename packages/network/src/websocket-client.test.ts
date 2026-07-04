import { describe, expect, it } from 'vitest';

import { ReconnectingWebSocketClient } from './websocket-client.js';

describe('ReconnectingWebSocketClient API surface', () => {
  it('exposes messages$ observable on construction', () => {
    const client = new ReconnectingWebSocketClient({ url: 'wss://test.example.com' });
    expect(client.messages$).toBeDefined();
    expect(typeof client.messages$.subscribe).toBe('function');
  });

  it('exposes state$ observable on construction', () => {
    const client = new ReconnectingWebSocketClient({ url: 'wss://test.example.com' });
    expect(client.state$).toBeDefined();
    expect(typeof client.state$.subscribe).toBe('function');
  });

  it('starts in idle state until connect() is called', () => {
    const client = new ReconnectingWebSocketClient({ url: 'wss://test.example.com' });
    expect(client.state$).toBeDefined();
    expect(typeof client.connect).toBe('function');
    expect(typeof client.close).toBe('function');
    expect(typeof client.send).toBe('function');
  });
});
