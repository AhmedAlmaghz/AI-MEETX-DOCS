import { describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

import type { DomainEvent, IsoDateString, Uuid } from '@aimeetx/types';

import { InMemoryEventBus } from './event-bus.js';

const makeEvent = (eventType: string, payload: Record<string, unknown> = {}): DomainEvent => ({
  eventId: 'evt_123' as Uuid,
  eventType,
  version: 1,
  timestamp: '2026-02-07T00:00:00.000Z' as IsoDateString,
  sourceModule: '@aimeetx/test',
  correlationId: 'corr_123' as Uuid,
  payload,
});

describe('InMemoryEventBus', () => {
  it('publishes and receives events of a specific type', async () => {
    const bus = new InMemoryEventBus();
    const event = makeEvent('MeetingCreated', { meetingId: 'meet_123' });

    const received = firstValueFrom(bus.on('MeetingCreated'));
    bus.publish(event);

    const result = await received;
    expect(result.eventType).toBe('MeetingCreated');
    expect(result.payload).toEqual({ meetingId: 'meet_123' });

    bus.dispose();
  });

  it('filters events by type', () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    const subscription = bus.on('MeetingCreated').subscribe(handler);
    bus.publish(makeEvent('ParticipantJoined'));
    bus.publish(makeEvent('MeetingCreated', { meetingId: 'meet_1' }));
    bus.publish(makeEvent('MeetingCreated', { meetingId: 'meet_2' }));

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ eventType: 'MeetingCreated', payload: { meetingId: 'meet_1' } }),
    );
    expect(handler).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ eventType: 'MeetingCreated', payload: { meetingId: 'meet_2' } }),
    );

    subscription.unsubscribe();
    bus.dispose();
  });

  it('onAll receives every event', () => {
    const bus = new InMemoryEventBus();
    const handler = vi.fn();

    const subscription = bus.onAll().subscribe(handler);
    bus.publish(makeEvent('MeetingCreated'));
    bus.publish(makeEvent('ParticipantJoined'));
    bus.publish(makeEvent('MeetingEnded'));

    expect(handler).toHaveBeenCalledTimes(3);

    subscription.unsubscribe();
    bus.dispose();
  });

  it('throws when publishing after dispose', () => {
    const bus = new InMemoryEventBus();
    bus.dispose();
    expect(() => bus.publish(makeEvent('MeetingCreated'))).toThrow('EventBus has been disposed');
  });

  it('supports multiple subscribers for the same event type', () => {
    const bus = new InMemoryEventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const sub1 = bus.on('MeetingCreated').subscribe(handler1);
    const sub2 = bus.on('MeetingCreated').subscribe(handler2);

    bus.publish(makeEvent('MeetingCreated'));

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    sub1.unsubscribe();
    sub2.unsubscribe();
    bus.dispose();
  });
});