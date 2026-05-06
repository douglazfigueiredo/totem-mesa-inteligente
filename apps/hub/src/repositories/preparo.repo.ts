import { and, eq } from 'drizzle-orm';
import { preparos } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newPreparoId } from '../lib/ids.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import {
  Preparo,
  computeRemainingSec,
  type EmployeeId,
  type OrderId,
  type PreparoId,
  type PreparoStatus,
} from '@app/schemas';

export type StartPreparoInput = {
  orderId: OrderId;
  employeeId: EmployeeId;
  durationSec: number;
};

export const makePreparoRepo = (db: DBClient, clock: Clock) => ({
  start(input: StartPreparoInput): Preparo {
    const existing = db
      .select()
      .from(preparos)
      .where(eq(preparos.orderId, input.orderId))
      .get();

    if (existing) {
      throw new ConflictError(`preparo for order ${input.orderId} already exists`);
    }

    const id = newPreparoId() as PreparoId;
    const startedAt = clock.now();
    const row = {
      id,
      orderId: input.orderId,
      status: 'preparando' as const satisfies PreparoStatus,
      startedAt,
      durationSec: input.durationSec,
      startedByEmployeeId: input.employeeId,
      readyAt: null,
      cancelledAt: null,
    };

    db.insert(preparos).values(row).run();
    return rowToPreparo(row);
  },

  getById(id: PreparoId): Preparo | null {
    const row = db.select().from(preparos).where(eq(preparos.id, id)).get();
    return row ? rowToPreparo(row) : null;
  },

  getByOrderId(orderId: OrderId): Preparo | null {
    const row = db.select().from(preparos).where(eq(preparos.orderId, orderId)).get();
    return row ? rowToPreparo(row) : null;
  },

  markReady(id: PreparoId): Preparo {
    const now = clock.now();
    const result = db
      .update(preparos)
      .set({ status: 'pronto', readyAt: now })
      .where(and(eq(preparos.id, id), eq(preparos.status, 'preparando')))
      .run();
    if (result.changes === 0) {
      const cur = this.getById(id);
      if (!cur) throw new NotFoundError(`preparo ${id} not found`);
      throw new ConflictError(`preparo ${id} already in status ${cur.status}`);
    }
    const updated = this.getById(id);
    if (!updated) throw new NotFoundError(`preparo ${id} disappeared`);
    return updated;
  },

  cancel(id: PreparoId): Preparo {
    const now = clock.now();
    db.update(preparos)
      .set({ status: 'cancelado', cancelledAt: now })
      .where(and(eq(preparos.id, id), eq(preparos.status, 'preparando')))
      .run();
    const updated = this.getById(id);
    if (!updated) throw new NotFoundError(`preparo ${id} not found`);
    return updated;
  },

  listDue(nowMs: number = clock.now()): Preparo[] {
    const rows = db
      .select()
      .from(preparos)
      .where(eq(preparos.status, 'preparando'))
      .all();
    return rows
      .map(rowToPreparo)
      .filter((p) => computeRemainingSec(p, nowMs) === 0);
  },

  listActive(): Preparo[] {
    const rows = db
      .select()
      .from(preparos)
      .where(eq(preparos.status, 'preparando'))
      .all();
    return rows.map(rowToPreparo);
  },
});

const rowToPreparo = (row: typeof preparos.$inferSelect): Preparo =>
  Preparo.parse({
    ...row,
    readyAt: row.readyAt ?? undefined,
    cancelledAt: row.cancelledAt ?? undefined,
  });

export type PreparoRepo = ReturnType<typeof makePreparoRepo>;
