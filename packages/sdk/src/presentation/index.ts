/**
 * @aimeetx/sdk — Presentation layer.
 *
 * Per ADR-005: this directory holds framework-agnostic state primitives
 * (signals, stores, hooks) that clients can opt into. The domain layer
 * has zero React/Next.js/Node.js dependencies, but the presentation
 * layer is where cross-cutting state lives.
 *
 * The actual React hooks live in apps/web (and other clients) because
 * they are presentation concerns. This module exposes SDK-side helpers
 * (e.g. signal adapters, observable stores) that bind to the
 * RxJS-based event bus from @aimeetx/events.
 *
 * Per ADR-002's surviving rules: clients must depend only on this
 * presentation layer, never reach into domain directly from UI code.
 */

export type { Signal, ReadonlySignal } from './signals.js';
export { createSignal, createComputed } from './signals.js';
export { createEventStore, type EventStore, type EventSubject } from './event-store.js';
