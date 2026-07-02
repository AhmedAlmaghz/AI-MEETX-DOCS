/**
 * DI tokens for the AI MeetX SDK.
 *
 * Per ADR-004 (Clean Architecture) and ADR-005 §7:
 * The SDK uses tsyringe as the DI container. Tokens are unique symbols
 * that identify dependencies in the container.
 *
 * Each token corresponds to a Port (interface) in the domain layer.
 * Implementations are bound to these tokens in the data layer.
 */
export const TOKENS = {
  // Infrastructure
  HttpClient: Symbol.for('@aimeetx/sdk/HttpClient'),
  EventBus: Symbol.for('@aimeetx/sdk/EventBus'),
  KeyValueStore: Symbol.for('@aimeetx/sdk/KeyValueStore'),
  SecureTokenStorage: Symbol.for('@aimeetx/sdk/SecureTokenStorage'),

  // Repositories (Ports)
  UserRepository: Symbol.for('@aimeetx/sdk/UserRepository'),
  AuthRepository: Symbol.for('@aimeetx/sdk/AuthRepository'),

  // Use Cases
  GetCurrentUserUseCase: Symbol.for('@aimeetx/sdk/GetCurrentUserUseCase'),
  LoginWithEmailUseCase: Symbol.for('@aimeetx/sdk/LoginWithEmailUseCase'),
  RegisterWithEmailUseCase: Symbol.for('@aimeetx/sdk/RegisterWithEmailUseCase'),
  LoginAsGuestUseCase: Symbol.for('@aimeetx/sdk/LoginAsGuestUseCase'),
  LogoutUseCase: Symbol.for('@aimeetx/sdk/LogoutUseCase'),
  RefreshSessionUseCase: Symbol.for('@aimeetx/sdk/RefreshSessionUseCase'),
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];