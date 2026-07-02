import type { IsoDateString, UserId } from '@aimeetx/types';

/**
 * Authentication credentials.
 *
 * Per `08_DATABASE_OVERVIEW.md` §5: User authentication fields.
 */
export interface AuthCredentials {
  readonly email: string;
  readonly password: string;
}

/**
 * Registration input.
 */
export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly displayName: string;
  readonly preferredLanguage?: string;
}

/**
 * Session status.
 */
export type SessionStatus = 'active' | 'expired' | 'revoked' | 'guest';

/**
 * Authentication session.
 *
 * Per ADR-004 (Clean Architecture): this is a pure TypeScript entity in the domain layer.
 * It MUST NOT depend on any infrastructure (HTTP, IndexedDB, React, etc.).
 */
export interface Session {
  readonly id: string;
  readonly userId: UserId;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: IsoDateString;
  readonly status: SessionStatus;
  readonly createdAt: IsoDateString;
}

/**
 * Authentication error types.
 */
export type AuthError =
  | { readonly code: 'InvalidCredentials'; readonly message: string }
  | { readonly code: 'EmailAlreadyInUse'; readonly message: string }
  | { readonly code: 'WeakPassword'; readonly message: string }
  | { readonly code: 'InvalidEmail'; readonly message: string }
  | { readonly code: 'UserNotFound'; readonly message: string }
  | { readonly code: 'SessionExpired'; readonly message: string }
  | { readonly code: 'TooManyRequests'; readonly message: string }
  | { readonly code: 'NetworkError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };