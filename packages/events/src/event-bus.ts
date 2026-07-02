import type { Observable, Subject } from 'rxjs';
import { Subject as RxSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import type { DomainEvent } from '@aimeetx/types';

/**
 * Type-safe event bus for the AI MeetX platform.
 *
 * Per ADR-002 (Event-Driven Architecture) and `09_EVENT_SYSTEM.md`:
 * The event bus is the ONLY mechanism for cross-module communication within the SDK.
 * Direct feature-to-feature implementation dependencies are prohibited.
 *
 * @example
 * ```ts
 * const bus = new InMemoryEventBus();
 *
 * // Subscribe to a specific event type
 * const subscription = bus.on('MeetingCreated').subscribe((event) => {
 *   console.log('Meeting created:', event.payload);
 * });
 *
 * // Publish an event
 * bus.publish({
 *   eventId: '...' as Uuid,
 *   eventType: 'MeetingCreated',
 *   version: 1,
 *   timestamp: new Date().toISOString() as IsoDateString,
 *   sourceModule: '@aimeetx/sdk/meeting',
 *   correlationId: '...' as Uuid,
 *   payload: { meetingId: 'meet_123' },
 * });
 *
 * subscription.unsubscribe();
 * ```
 */
export interface EventBus {
  /**
   * Publishes a domain event to all subscribers.
   * Events are delivered at-least-once; consumers MUST tolerate duplicates.
   */
  publish(event: DomainEvent): void;

  /**
   * Subscribes to all events of a specific type.
   * Returns an Observable that emits matching events.
   */
  on<T extends DomainEvent>(eventType: T['eventType']): Observable<T>;

  /**
   * Subscribes to all events.
   * Returns an Observable that emits every published event.
   */
  onAll(): Observable<DomainEvent>;

  /**
   * Completes all internal subjects and prevents further publishing.
   */
  dispose(): void;
}

/**
 * In-memory implementation of EventBus using RxJS Subjects.
 *
 * Suitable for:
 * - Single-process applications (web, desktop, mobile)
 * - Testing
 * - Development
 *
 * For distributed scenarios, use a network-backed implementation (e.g., Kafka, Redis Pub/Sub).
 */
export class InMemoryEventBus implements EventBus {
  private readonly subject: Subject<DomainEvent> = new RxSubject<DomainEvent>();
  private disposed = false;

  publish(event: DomainEvent): void {
    if (this.disposed) {
      throw new Error('EventBus has been disposed');
    }
    this.subject.next(event);
  }

  on<T extends DomainEvent>(eventType: T['eventType']): Observable<T> {
    return this.subject
      .asObservable()
      .pipe(filter((e: DomainEvent): e is T => e.eventType === eventType));
  }

  onAll(): Observable<DomainEvent> {
    return this.subject.asObservable();
  }

  dispose(): void {
    this.disposed = true;
    this.subject.complete();
  }
}