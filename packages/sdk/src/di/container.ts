import 'reflect-metadata';

import { container, type DependencyContainer } from 'tsyringe';

import type { EventBus } from '@aimeetx/events';
import { InMemoryEventBus } from '@aimeetx/events';
import type { HttpClient } from '@aimeetx/network';
import { FetchHttpClient } from '@aimeetx/network';
import type { KeyValueStore } from '@aimeetx/storage';
import { InMemoryKeyValueStore } from '@aimeetx/storage';

import { TOKENS } from './tokens.js';

export { TOKENS };

/**
 * Default SDK configuration.
 */
export interface SdkConfig {
  readonly apiBaseUrl: string;
  readonly authToken?: string;
  readonly enableLogging?: boolean;
}

/**
 * Initialize the SDK DI container with default implementations.
 *
 * Per ADR-004 (Clean Architecture) and ADR-005 §7:
 * The DI container binds Ports (interfaces) to concrete implementations.
 * Clients can override bindings before calling this function.
 *
 * @example
 * ```ts
 * import { initializeSdk, TOKENS } from '@aimeetx/sdk';
 *
 * // Override a binding before initialization
 * container.register(TOKENS.HttpClient, { useValue: customHttpClient });
 *
 * const sdk = initializeSdk({
 *   apiBaseUrl: 'https://api.aimeetx.com',
 *   authToken: '...',
 * });
 * ```
 */
export function initializeSdk(config: SdkConfig): DependencyContainer {
  // Register default infrastructure implementations
  if (!container.isRegistered(TOKENS.HttpClient)) {
    container.register<HttpClient>(TOKENS.HttpClient, {
      useFactory: () =>
        new FetchHttpClient(
          config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {},
        ),
    });
  }

  if (!container.isRegistered(TOKENS.EventBus)) {
    container.register<EventBus>(TOKENS.EventBus, {
      useClass: InMemoryEventBus,
    });
  }

  if (!container.isRegistered(TOKENS.KeyValueStore)) {
    container.register<KeyValueStore>(TOKENS.KeyValueStore, {
      useClass: InMemoryKeyValueStore,
    });
  }

  return container;
}

/**
 * Reset the DI container (useful for testing).
 */
export function resetSdk(): void {
  container.reset();
}

/**
 * The default SDK container instance.
 */
export { container as sdkContainer };