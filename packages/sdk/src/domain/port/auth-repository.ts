import type { Result } from '@aimeetx/types';

import type { AuthCredentials, RegisterInput, Session } from '../model/auth.js';

/**
 * Auth repository port (interface).
 *
 * Per ADR-004 (Clean Architecture): this is a Port in the domain layer.
 * The implementation lives in the data layer (e.g., HttpAuthRepository, FirebaseAuthRepository).
 *
 * Per `08_DATABASE_OVERVIEW.md` §3: Repository Pattern — UI SHALL NEVER access storage directly.
 */
export interface AuthRepository {
  /** Login with email and password. */
  loginWithEmail(credentials: AuthCredentials): Promise<Result<Session, Error>>;

  /** Register a new user with email and password. */
  register(input: RegisterInput): Promise<Result<Session, Error>>;

  /** Login as a guest (anonymous session). */
  loginAsGuest(): Promise<Result<Session, Error>>;

  /** Logout the current session. */
  logout(sessionId: string): Promise<Result<void, Error>>;

  /** Refresh an expired session using the refresh token. */
  refreshSession(refreshToken: string): Promise<Result<Session, Error>>;

  /** Get the current active session, if any. */
  getCurrentSession(): Promise<Result<Session | null, Error>>;
}