'use client';
import { useEffect, useRef } from 'react';
import { resolveUseCase } from './bootstrap';
import { TOKENS } from '@aimeetx/sdk';

export function useEventBus<T extends { eventType: string }>(
  eventType: T['eventType'],
  handler: (event: T) => void,
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let cancelled = false;
    try {
      const eventBus: unknown = resolveUseCase(TOKENS.EventBus);
      const bus = eventBus as {
        on(et: string): { subscribe(fn: (e: unknown) => void): { unsubscribe(): void } };
      };
      const subscription = bus.on(eventType).subscribe((event: unknown) => {
        if (!cancelled) handlerRef.current(event as T);
      });
      return () => {
        cancelled = true;
        subscription.unsubscribe();
      };
    } catch {
      return;
    }
  }, [eventType]);
}
