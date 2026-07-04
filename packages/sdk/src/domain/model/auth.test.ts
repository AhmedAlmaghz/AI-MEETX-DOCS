import { describe, expect, it } from 'vitest';

import type { Session, SessionStatus } from './auth.js';

describe('Auth domain types', () => {
  it('SessionStatus is a string-literal union', () => {
    const statuses: SessionStatus[] = ['active', 'expired', 'revoked'];
    expect(statuses).toHaveLength(3);
  });

  it('Session shape has the required core fields', () => {
    const session: Session = {
      userId: 'user_1' as never,
      accessToken: 'access_token_value',
      refreshToken: 'refresh_token_value',
      expiresAt: '2026-12-31T23:59:59.000Z' as never,
      status: 'active',
    };

    expect(session.userId).toBeTruthy();
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();
    expect(session.expiresAt).toBeTruthy();
    expect(session.status).toBe('active');
  });
});
