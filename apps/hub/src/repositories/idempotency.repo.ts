import { eq, lt } from 'drizzle-orm';
import { processedEvents } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import type { EventId, WSEventType } from '@app/schemas';

export type ProcessedEvent = {
  eventId: EventId;
  type: WSEventType;
  deviceId: string | null;
  processedAt: number;
  resultJson: string | null;
};

export const makeIdempotencyRepo = (db: DBClient, clock: Clock) => ({
  get(eventId: EventId): ProcessedEvent | null {
    const row = db
      .select()
      .from(processedEvents)
      .where(eq(processedEvents.eventId, eventId))
      .get();
    return row ? (row as ProcessedEvent) : null;
  },

  has(eventId: EventId): boolean {
    return this.get(eventId) !== null;
  },

  record(input: {
    eventId: EventId;
    type: WSEventType;
    deviceId?: string;
    result?: unknown;
  }): void {
    db.insert(processedEvents)
      .values({
        eventId: input.eventId,
        type: input.type,
        deviceId: input.deviceId ?? null,
        processedAt: clock.now(),
        resultJson: input.result === undefined ? null : JSON.stringify(input.result),
      })
      .onConflictDoNothing()
      .run();
  },

  pruneBefore(olderThanMs: number): number {
    const cutoff = clock.now() - olderThanMs;
    const r = db
      .delete(processedEvents)
      .where(lt(processedEvents.processedAt, cutoff))
      .run();
    return r.changes;
  },
});

export type IdempotencyRepo = ReturnType<typeof makeIdempotencyRepo>;
