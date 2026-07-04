import type { Observable, Subject } from 'rxjs';

import type { DomainEvent } from '@aimeetx/types';

/**
 * Type-safe event store for SDK consumers.
 *
 * Wraps the event bus as a unified typed observable so presentation layers
 * can subscribe without knowing about the underlying bus implementation.
 */
export interface EventStore {
  ofType<TEventType extends string>(
    eventType: TEventType,
  ): Observable<DomainEvent & { eventType: TEventType }>;
  allEvents$(): Observable<DomainEvent>;
}

export function createEventStore(bus: {
  on<TEventType extends string>(eventType: TEventType): Observable<DomainEvent & { eventType: TEventType }>;
  onAll(): Observable<DomainEvent>;
}): EventStore {
  return {
    ofType: <TEventType extends string>(eventType: TEventType) => bus.on(eventType),
    allEvents$: () => bus.onAll(),
  };
}

/**
 * Internal subject factory — exposed for tests and advanced consumers
 * that need to build a custom event bus compatible with the SDK.
 */
export type EventSubject = Subject<DomainEvent>;
