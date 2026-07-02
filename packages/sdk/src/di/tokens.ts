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

  // Repositories (Ports)
  UserRepository: Symbol.for('@aimeetx/sdk/UserRepository'),

  // Use Cases
  GetCurrentUserUseCase: Symbol.for('@aimeetx/sdk/GetCurrentUserUseCase'),
} as const;

export type Token = (typeof TOKENS)[keyof typeof TOKENS];