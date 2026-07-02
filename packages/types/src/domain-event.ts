import type { IsoDateString, Uuid } from './branded.js';

/**
 * Base interface for all domain events.
 *
 * Per ADR-002 (Event-Driven Architecture) and `09_EVENT_SYSTEM.md`:
 * Every event SHALL be immutable, serializable, versioned, documented, traceable, and testable.
 *
 * @example
 * ```ts
 * interface MeetingCreatedEvent extends DomainEvent {
 *   readonly eventType: 'MeetingCreated';
 *   readonly meetingId: MeetingId;
 *   readonly title: string;
 * }
 * ```
 */
export interface DomainEvent {
  /** Unique identifier for this event instance. */
  readonly eventId: Uuid;

  /** Event type discriminator (e.g., 'MeetingCreated'). */
  readonly eventType: string;

  /** Schema version of this event. Increment on breaking changes. */
  readonly version: number;

  /** ISO 8601 timestamp when the event was produced. */
  readonly timestamp: IsoDateString;

  /** Module that produced the event (e.g., '@aimeetx/sdk/meeting'). */
  readonly sourceModule: string;

  /** Correlation ID for distributed tracing across the platform. */
  readonly correlationId: Uuid;

  /** Event-specific payload. */
  readonly payload: Readonly<Record<string, unknown>>;
}

/**
 * Metadata attached to every event for observability.
 */
export interface EventMetadata {
  readonly userId?: string;
  readonly sessionId?: string;
  readonly traceId?: string;
  readonly [key: string]: unknown;
}