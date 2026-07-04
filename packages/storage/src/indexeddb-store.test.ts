import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

import { IndexedDBKeyValueStore } from './indexeddb-store.js';

describe('IndexedDBKeyValueStore', () => {
  let store: IndexedDBKeyValueStore;
  let sequence = 0;

  beforeEach(() => {
    sequence += 1;
    store = new IndexedDBKeyValueStore(`test-db-${sequence}`, 'test-store', 1);
  });

  it('sets and gets a value', async () => {
    const setResult = await store.set('user_1', { name: 'Alice' });
    expect(setResult.isSuccess).toBe(true);

    const getResult = await store.get<{ name: string }>('user_1');
    expect(getResult.isSuccess).toBe(true);
    if (getResult.isSuccess) {
      expect(getResult.value?.name).toBe('Alice');
    }
  });

  it('returns null for missing keys', async () => {
    const getResult = await store.get('does_not_exist');
    expect(getResult.isSuccess).toBe(true);
    if (getResult.isSuccess) {
      expect(getResult.value).toBeNull();
    }
  });

  it('checks if a key exists', async () => {
    await store.set('present', 1);
    const hasResult = await store.has('present');
    expect(hasResult.isSuccess).toBe(true);
    if (hasResult.isSuccess) expect(hasResult.value).toBe(true);

    const missing = await store.has('absent');
    if (missing.isSuccess) expect(missing.value).toBe(false);
  });

  it('deletes a key', async () => {
    await store.set('k', 'v');
    await store.delete('k');
    const hasResult = await store.has('k');
    if (hasResult.isSuccess) expect(hasResult.value).toBe(false);
  });

  it('clears all entries', async () => {
    await store.set('a', 1);
    await store.set('b', 2);
    await store.clear();

    const hasA = await store.has('a');
    const hasB = await store.has('b');
    if (hasA.isSuccess) expect(hasA.value).toBe(false);
    if (hasB.isSuccess) expect(hasB.value).toBe(false);
  });
});
