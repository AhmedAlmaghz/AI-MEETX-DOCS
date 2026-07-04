import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

/**
 * Generic key-value storage interface.
 *
 * Per ADR-004 (Clean Architecture): this is a Port (interface) in the domain layer.
 * Implementations live in the data layer (IndexedDB, secure storage, memory cache).
 */
export interface KeyValueStore {
  get<T>(key: string): Promise<Result<T | null, StorageError>>;
  set<T>(key: string, value: T): Promise<Result<void, StorageError>>;
  delete(key: string): Promise<Result<void, StorageError>>;
  has(key: string): Promise<Result<boolean, StorageError>>;
  clear(): Promise<Result<void, StorageError>>;
}

/**
 * Storage error types.
 */
export type StorageError =
  | { readonly code: 'NotFound'; readonly message: string }
  | { readonly code: 'QuotaExceeded'; readonly message: string }
  | { readonly code: 'Unavailable'; readonly message: string }
  | { readonly code: 'SerializationError'; readonly message: string; readonly cause?: unknown }
  | { readonly code: 'Unknown'; readonly message: string; readonly cause?: unknown };

/**
 * In-memory implementation of KeyValueStore.
 *
 * Useful for:
 * - Testing
 * - SSR (server-side rendering) where IndexedDB is unavailable
 * - Short-lived caches
 */
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly store = new Map<string, string>();

  get<T>(key: string): Promise<Result<T | null, StorageError>> {
    const raw = this.store.get(key);
    if (raw === undefined) return Promise.resolve(success(null));
    try {
      return Promise.resolve(success(JSON.parse(raw) as T));
    } catch (cause) {
      return Promise.resolve(failure({
        code: 'SerializationError',
        message: `Failed to deserialize value for key "${key}"`,
        cause,
      }));
    }
  }

  set<T>(key: string, value: T): Promise<Result<void, StorageError>> {
    try {
      this.store.set(key, JSON.stringify(value));
      return Promise.resolve(success(undefined));
    } catch (cause) {
      return Promise.resolve(failure({
        code: 'SerializationError',
        message: `Failed to serialize value for key "${key}"`,
        cause,
      }));
    }
  }

  delete(key: string): Promise<Result<void, StorageError>> {
    this.store.delete(key);
    return Promise.resolve(success(undefined));
  }

  has(key: string): Promise<Result<boolean, StorageError>> {
    return Promise.resolve(success(this.store.has(key)));
  }

  clear(): Promise<Result<void, StorageError>> {
    this.store.clear();
    return Promise.resolve(success(undefined));
  }
}