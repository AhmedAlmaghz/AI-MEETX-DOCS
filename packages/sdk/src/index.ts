/**
 * @aimeetx/sdk — Public API surface.
 *
 * This is the entry point for all consumers (web, desktop, mobile, 3rd-party).
 * Per ADR-005: the SDK is the single source of truth for all business logic.
 */

// tsyringe requires reflect-metadata to be imported BEFORE any other code.
// This MUST be the first import in the SDK entry point.
import 'reflect-metadata';

// Domain layer
export type { UseCase } from './domain/use-case.js';
export type { User } from './domain/model/user.js';
export type { UserRepository } from './domain/port/user-repository.js';
export { GetCurrentUserUseCase, type GetCurrentUserCommand } from './domain/usecase/get-current-user.js';

// Auth domain
export type {
  AuthCredentials,
  RegisterInput,
  Session,
  SessionStatus,
  AuthError,
} from './domain/model/auth.js';
export type { AuthRepository } from './domain/port/auth-repository.js';
export type { SecureTokenStorage } from './domain/port/secure-token-storage.js';
export type {
  UserLoggedInEvent,
  UserLoggedOutEvent,
  SessionExpiredEvent,
  SessionRefreshedEvent,
  AuthEvent,
} from './domain/event/auth-events.js';
export {
  LoginWithEmailUseCase,
  RegisterWithEmailUseCase,
  LoginAsGuestUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
} from './domain/usecase/auth-use-cases.js';

// Data layer
export { HttpAuthRepository } from './data/http-auth-repository.js';
export { WebSecureTokenStorage } from './data/web-secure-token-storage.js';

// DI
export { TOKENS, type Token } from './di/tokens.js';
export { initializeSdk, resetSdk, sdkContainer, type SdkConfig } from './di/container.js';
