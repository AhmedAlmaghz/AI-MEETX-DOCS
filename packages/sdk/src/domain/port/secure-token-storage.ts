import type { Result } from '@aimeetx/types';

import type { Session } from '../model/auth.js';

/**
 * Secure token storage port (interface).
 *
 * Per `06_TECH_STACK.md` §7: sensitive data (tokens, refresh tokens) MUST be stored
 * in encrypted storage. On web, this uses the Web Crypto API with a key derived
 * from a user-specific passphrase or device fingerprint.
 *
 * Per ADR-004: this is a Port in the domain layer.
 */
export interface SecureTokenStorage {
  /** Store a session securely. */
  storeSession(session: Session): Promise<Result<void, Error>>;

  /** Retrieve the stored session, if any. */
  getSession(): Promise<Result<Session | null, Error>>;

  /** Clear the stored session. */
  clearSession(): Promise<Result<void, Error>>;

  /** Check if a session is stored. */
  hasSession(): Promise<Result<boolean, Error>>;
}