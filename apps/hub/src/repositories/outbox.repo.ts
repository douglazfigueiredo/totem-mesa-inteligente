import { and, asc, eq, isNull, lte, or, sql } from 'drizzle-orm';
import { eventOutbox } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import type { EventId, TenantId, WSEventType } from '@app/schemas';

export type OutboxEntry = {
  eventId: EventId;
  tenantId: TenantId;
  type: WSEventType;
  payload: unknown;
  createdAt: number;
  sentAt: number | null;
  attempts: number;
  lastError: string | null;
  nextRetryAt: number | null;
};

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];

export const makeOutboxRepo = (db: DBClient, clock: Clock) => ({
  enqueue(input: {
    eventId: EventId;
    tenantId: TenantId;
    type: WSEventType;
    payload: unknown;
  }): void {
    db.insert(eventOutbox)
      .values({
        eventId: input.eventId,
        tenantId: input.tenantId,
        type: input.type,
        payload: input.payload,
        createdAt: clock.now(),
        sentAt: null,
        attempts: 0,
        lastError: null,
        nextRetryAt: null,
      })
      .onConflictDoNothing()
      .run();
  },

  listPending(limit = 100): OutboxEntry[] {
    const now = clock.now();
    const rows = db
      .select()
      .from(eventOutbox)
      .where(
        and(
          isNull(eventOutbox.sentAt),
          or(isNull(eventOutbox.nextRetryAt), lte(eventOutbox.nextRetryAt, now)),
        ),
      )
      .orderBy(asc(eventOutbox.createdAt))
      .limit(limit)
      .all();
    return rows as OutboxEntry[];
  },

  markSent(eventId: EventId): void {
    db.update(eventOutbox)
      .set({ sentAt: clock.now(), nextRetryAt: null, lastError: null })
      .where(eq(eventOutbox.eventId, eventId))
      .run();
  },

  markFailed(eventId: EventId, error: string): void {
    const now = clock.now();
    const row = db.select().from(eventOutbox).where(eq(eventOutbox.eventId, eventId)).get();
    if (!row) return;
    const attempts = row.attempts + 1;
    const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)] ?? 30_000;
    db.update(eventOutbox)
      .set({
        attempts,
        lastError: error.slice(0, 500),
        nextRetryAt: now + delay,
      })
      .where(eq(eventOutbox.eventId, eventId))
      .run();
  },

  pendingCount(): number {
    const r = db
      .select({ c: sql<number>`count(*)` })
      .from(eventOutbox)
      .where(isNull(eventOutbox.sentAt))
      .get();
    return r?.c ?? 0;
  },

  pruneSentBefore(beforeMs: number): number {
    const r = db.delete(eventOutbox).where(lte(eventOutbox.sentAt, beforeMs)).run();
    return r.changes;
  },
});

export type OutboxRepo = ReturnType<typeof makeOutboxRepo>;
