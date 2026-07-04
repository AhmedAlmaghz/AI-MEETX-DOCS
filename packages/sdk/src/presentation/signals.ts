/**
 * Framework-agnostic signal primitive.
 *
 * Per ADR-005: the SDK exposes simple reactive primitives that any client
 * framework can adopt (React, Solid, Vue, Svelte). Signals are NOT React
 * hooks — clients must adapt them in their own presentation layer.
 */

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
  subscribe(fn: (value: T) => void): () => void;
}

export interface ReadonlySignal<T> {
  get(): T;
  subscribe(fn: (value: T) => void): () => void;
}

export function createSignal<T>(initial: T): Signal<T> {
  let value = initial;
  const subscribers = new Set<(value: T) => void>();

  return {
    get: () => value,
    set: (next: T) => {
      if (Object.is(value, next)) return;
      value = next;
      for (const fn of subscribers) fn(value);
    },
    update: (fn: (prev: T) => T) => {
      const next = fn(value);
      if (Object.is(value, next)) return;
      value = next;
      for (const sub of subscribers) sub(value);
    },
    subscribe: (fn: (value: T) => void) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}

export function createComputed<T>(deps: ReadonlyArray<ReadonlySignal<unknown>>, compute: () => T): ReadonlySignal<T> {
  const internal = createSignal<T>(compute());
  const recompute = (): void => {
    internal.set(compute());
  };
  for (const dep of deps) {
    dep.subscribe(recompute);
  }
  recompute();
  return {
    get: () => internal.get(),
    subscribe: (fn) => internal.subscribe(fn),
  };
}
