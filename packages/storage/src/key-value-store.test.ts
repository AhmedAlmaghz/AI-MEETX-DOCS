import { describe, expect, it, beforeEach } from 'vitest';

import { InMemoryKeyValueStore } from './key-value-store.js';

describe('InMemoryKeyValueStore', () => {
  let store: InMemoryKeyValueStore;

  beforeEach(() => {
    store = new InMemoryKeyValueStore();
  });

  it('sets and gets a value', async () => {
    const setResult = await store.set('key1', { name: 'test' });
    expect(setResult.isSuccess).toBe(true);

    const getResult = await store.get<{ name: string }>('key1');
    expect(getResult.isSuccess).toBe(true);
    if (getResult.isSuccess) {
      expect(getResult.value?.name).toBe('test');
    }
  });

  it('returns null for missing keys', async () => {
    const result = await store.get('nonexistent');
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value).toBeNull();
    }
  });

  it('deletes a value', async () => {
    await store.set('key2', 'value');
    await store.delete('key2');
    const has = await store.has('key2');
    if (has.isSuccess) expect(has.value).toBe(false);
  });

  it('checks if a key exists', async () => {
    await store.set('key3', 42);
    const hasResult = await store.has('key3');
    expect(hasResult.isSuccess).toBe(true);
    if (hasResult.isSuccess) expect(hasResult.value).toBe(true);

    const missingResult = await store.has('nope');
    if (missingResult.isSuccess) expect(missingResult.value).toBe(false);
  });

  it('clears all entries', async () => {
    await store.set('a', 1);
    await store.set('b', 2);
    await store.clear();
    const hasA = await store.has('a');
    if (hasA.isSuccess) expect(hasA.value).toBe(false);
  });

  it('handles primitive values', async () => {
    await store.set('num', 123);
    await store.set('str', 'hello');
    await store.set('bool', true);

    const num = await store.get<number>('num');
    const str = await store.get<string>('str');
    const bool = await store.get<boolean>('bool');

    if (num.isSuccess) expect(num.value).toBe(123);
    if (str.isSuccess) expect(str.value).toBe('hello');
    if (bool.isSuccess) expect(bool.value).toBe(true);
  });
});