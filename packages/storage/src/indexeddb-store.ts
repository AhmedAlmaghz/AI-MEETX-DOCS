import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';

import type { Result } from '@aimeetx/types';
import { failure, success } from '@aimeetx/types';

import type { KeyValueStore, StorageError } from './key-value-store.js';

/**
 * IndexedDB-backed implementation of KeyValueStore.
 *
 * Per `06_TECH_STACK.md` §7: structured data uses IndexedDB via the `idb` library.
 *
 * Browser-only. Will fail with `Unavailable` error in Node.js / SSR contexts.
 */
export class IndexedDBKeyValueStore implements KeyValueStore {
  private readonly dbPromise: Promise<IDBPDatabase>;

  constructor(
    private readonly dbName: string,
    private readonly storeName: string,
    private readonly version = 1,
  ) {
    this.dbPromise = openDB(this.dbName, this.version, {
      upgrade: (db: IDBPDatabase) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      },
    });
  }

  async get<T>(key: string): Promise<Result<T | null, StorageError>> {
    try {
      const db = await this.dbPromise;
      const value = await db.get(this.storeName, key);
      return success((value as T | undefined) ?? null);
    } catch (cause) {
      return failure({
        code: 'Unknown',
        message: `IndexedDB get failed for key "${key}"`,
        cause,
      });
    }
  }

  async set<T>(key: string, value: T): Promise<Result<void, StorageError>> {
    try {
      const db = await this.dbPromise;
      await db.put(this.storeName, value, key);
      return success(undefined);
    } catch (cause) {
      const err = cause as { name?: string };
      if (err.name === 'QuotaExceededError') {
        return failure({
          code: 'QuotaExceeded',
          message: `IndexedDB quota exceeded for key "${key}"`,
        });
      }
      return failure({
        code: 'Unknown',
        message: `IndexedDB set failed for key "${key}"`,
        cause,
      });
    }
  }

  async delete(key: string): Promise<Result<void, StorageError>> {
    try {
      const db = await this.dbPromise;
      await db.delete(this.storeName, key);
      return success(undefined);
    } catch (cause) {
      return failure({
        code: 'Unknown',
        message: `IndexedDB delete failed for key "${key}"`,
        cause,
      });
    }
  }

  async has(key: string): Promise<Result<boolean, StorageError>> {
    try {
      const db = await this.dbPromise;
      const value = await db.get(this.storeName, key);
      return success(value !== undefined);
    } catch (cause) {
      return failure({
        code: 'Unknown',
        message: `IndexedDB has failed for key "${key}"`,
        cause,
      });
    }
  }

  async clear(): Promise<Result<void, StorageError>> {
    try {
      const db = await this.dbPromise;
      await db.clear(this.storeName);
      return success(undefined);
    } catch (cause) {
      return failure({
        code: 'Unknown',
        message: 'IndexedDB clear failed',
        cause,
      });
    }
  }
}