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

// DI
export { TOKENS, type Token } from './di/tokens.js';
export { initializeSdk, resetSdk, sdkContainer, type SdkConfig } from './di/container.js';