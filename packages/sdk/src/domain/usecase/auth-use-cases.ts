import { inject, injectable } from 'tsyringe';

import type { Result, Uuid } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { EventBus } from '@aimeetx/events';

import type { AuthCredentials, RegisterInput, Session } from '../model/auth.js';
import type { AuthRepository } from '../port/auth-repository.js';
import type { SecureTokenStorage } from '../port/secure-token-storage.js';
import type { UseCase } from '../use-case.js';
import { TOKENS } from '../../di/tokens.js';

// ============================================================================
// LoginWithEmailUseCase
// ============================================================================

/**
 * LoginWithEmailUseCase — authenticates a user with email and password.
 *
 * Per `05_CODING_STANDARDS.md` §18: Use cases are single-responsibility.
 * This use case:
 * 1. Calls the auth repository to validate credentials
 * 2. Stores the session securely
 * 3. Publishes a UserLoggedInEvent
 */
@injectable()
export class LoginWithEmailUseCase implements UseCase<AuthCredentials, Session, Error> {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly authRepository: AuthRepository,
    @inject(TOKENS.SecureTokenStorage)
    private readonly tokenStorage: SecureTokenStorage,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(credentials: AuthCredentials): Promise<Result<Session, Error>> {
    // Validate input
    if (!credentials.email || !credentials.password) {
      return failure(new Error('Email and password are required'));
    }

    // Authenticate
    const authResult = await this.authRepository.loginWithEmail(credentials);
    if (authResult.isFailure) {
      return failure(authResult.error);
    }

    const session = authResult.value;

    // Store session securely
    const storeResult = await this.tokenStorage.storeSession(session);
    if (storeResult.isFailure) {
      return failure(storeResult.error);
    }

    // Publish event
    this.eventBus.publish({
      eventId: crypto.randomUUID() as Uuid,
      eventType: 'UserLoggedIn',
      version: 1,
      timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
      sourceModule: '@aimeetx/sdk/auth',
      correlationId: crypto.randomUUID() as Uuid,
      payload: {
        userId: session.userId,
        sessionId: session.id,
        isGuest: false,
        loginAt: session.createdAt,
      },
    });

    return success(session);
  }
}

// ============================================================================
// RegisterWithEmailUseCase
// ============================================================================

/**
 * RegisterWithEmailUseCase — creates a new user account.
 */
@injectable()
export class RegisterWithEmailUseCase implements UseCase<RegisterInput, Session, Error> {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly authRepository: AuthRepository,
    @inject(TOKENS.SecureTokenStorage)
    private readonly tokenStorage: SecureTokenStorage,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: RegisterInput): Promise<Result<Session, Error>> {
    // Validate input
    if (!input.email || !input.password || !input.displayName) {
      return failure(new Error('Email, password, and display name are required'));
    }

    if (input.password.length < 8) {
      return failure(new Error('Password must be at least 8 characters'));
    }

    // Register
    const authResult = await this.authRepository.register(input);
    if (authResult.isFailure) {
      return failure(authResult.error);
    }

    const session = authResult.value;

    // Store session securely
    const storeResult = await this.tokenStorage.storeSession(session);
    if (storeResult.isFailure) {
      return failure(storeResult.error);
    }

    // Publish event
    this.eventBus.publish({
      eventId: crypto.randomUUID() as Uuid,
      eventType: 'UserLoggedIn',
      version: 1,
      timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
      sourceModule: '@aimeetx/sdk/auth',
      correlationId: crypto.randomUUID() as Uuid,
      payload: {
        userId: session.userId,
        sessionId: session.id,
        isGuest: false,
        loginAt: session.createdAt,
      },
    });

    return success(session);
  }
}

// ============================================================================
// LoginAsGuestUseCase
// ============================================================================

/**
 * LoginAsGuestUseCase — creates an anonymous guest session.
 *
 * Per `02_PRODUCT_REQUIREMENTS.md`: guest access is supported for trial users.
 */
@injectable()
export class LoginAsGuestUseCase implements UseCase<void, Session, Error> {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly authRepository: AuthRepository,
    @inject(TOKENS.SecureTokenStorage)
    private readonly tokenStorage: SecureTokenStorage,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(_command: void): Promise<Result<Session, Error>> {
    const authResult = await this.authRepository.loginAsGuest();
    if (authResult.isFailure) {
      return failure(authResult.error);
    }

    const session = authResult.value;

    const storeResult = await this.tokenStorage.storeSession(session);
    if (storeResult.isFailure) {
      return failure(storeResult.error);
    }

    this.eventBus.publish({
      eventId: crypto.randomUUID() as Uuid,
      eventType: 'UserLoggedIn',
      version: 1,
      timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
      sourceModule: '@aimeetx/sdk/auth',
      correlationId: crypto.randomUUID() as Uuid,
      payload: {
        userId: session.userId,
        sessionId: session.id,
        isGuest: true,
        loginAt: session.createdAt,
      },
    });

    return success(session);
  }
}

// ============================================================================
// LogoutUseCase
// ============================================================================

/**
 * LogoutUseCase — terminates the current session.
 */
@injectable()
export class LogoutUseCase implements UseCase<void, void, Error> {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly authRepository: AuthRepository,
    @inject(TOKENS.SecureTokenStorage)
    private readonly tokenStorage: SecureTokenStorage,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(_command: void): Promise<Result<void, Error>> {
    // Get current session
    const sessionResult = await this.tokenStorage.getSession();
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }

    const session = sessionResult.value;
    if (!session) {
      // No session to logout from — treat as success
      return success(undefined);
    }

    // Logout on server
    const logoutResult = await this.authRepository.logout(session.id);
    if (logoutResult.isFailure) {
      return failure(logoutResult.error);
    }

    // Clear local session
    const clearResult = await this.tokenStorage.clearSession();
    if (clearResult.isFailure) {
      return failure(clearResult.error);
    }

    // Publish event
    this.eventBus.publish({
      eventId: crypto.randomUUID() as Uuid,
      eventType: 'UserLoggedOut',
      version: 1,
      timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
      sourceModule: '@aimeetx/sdk/auth',
      correlationId: crypto.randomUUID() as Uuid,
      payload: {
        userId: session.userId,
        sessionId: session.id,
        logoutAt: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
      },
    });

    return success(undefined);
  }
}

// ============================================================================
// RefreshSessionUseCase
// ============================================================================

/**
 * RefreshSessionUseCase — refreshes an expired session using the refresh token.
 *
 * Per `02_PRODUCT_REQUIREMENTS.md`: session expiry triggers automatic re-authentication.
 */
@injectable()
export class RefreshSessionUseCase implements UseCase<void, Session, Error> {
  constructor(
    @inject(TOKENS.AuthRepository)
    private readonly authRepository: AuthRepository,
    @inject(TOKENS.SecureTokenStorage)
    private readonly tokenStorage: SecureTokenStorage,
    @inject(TOKENS.EventBus)
    private readonly eventBus: EventBus,
  ) {}

  async execute(_command: void): Promise<Result<Session, Error>> {
    // Get current session
    const sessionResult = await this.tokenStorage.getSession();
    if (sessionResult.isFailure) {
      return failure(sessionResult.error);
    }

    const currentSession = sessionResult.value;
    if (!currentSession) {
      return failure(new Error('No active session to refresh'));
    }

    // Refresh
    const refreshResult = await this.authRepository.refreshSession(currentSession.refreshToken);
    if (refreshResult.isFailure) {
      return failure(refreshResult.error);
    }

    const newSession = refreshResult.value;

    // Store new session
    const storeResult = await this.tokenStorage.storeSession(newSession);
    if (storeResult.isFailure) {
      return failure(storeResult.error);
    }

    // Publish event
    this.eventBus.publish({
      eventId: crypto.randomUUID() as Uuid,
      eventType: 'SessionRefreshed',
      version: 1,
      timestamp: new Date().toISOString() as import('@aimeetx/types').IsoDateString,
      sourceModule: '@aimeetx/sdk/auth',
      correlationId: crypto.randomUUID() as Uuid,
      payload: {
        sessionId: newSession.id,
        userId: newSession.userId,
        newExpiresAt: newSession.expiresAt,
      },
    });

    return success(newSession);
  }
}