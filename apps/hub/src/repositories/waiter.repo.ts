import { and, desc, eq, inArray } from 'drizzle-orm';
import { waiterCalls } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newWaiterCallId } from '../lib/ids.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import {
  WaiterCall,
  type EmployeeId,
  type TableId,
  type TenantId,
  type WaiterCallId,
  type WaiterCallReason,
} from '@app/schemas';

const ACTIVE_STATUSES: ('pending' | 'acknowledged' | 'escalated')[] = [
  'pending',
  'acknowledged',
  'escalated',
];

export const makeWaiterRepo = (db: DBClient, clock: Clock) => ({
  create(input: {
    tenantId: TenantId;
    tableId: TableId;
    reason: WaiterCallReason;
    obs?: string;
  }): WaiterCall {
    const id = newWaiterCallId() as WaiterCallId;
    const row = {
      id,
      tenantId: input.tenantId,
      tableId: input.tableId,
      reason: input.reason,
      obs: input.obs ?? null,
      status: 'pending' as const,
      createdAt: clock.now(),
      acknowledgedBy: null,
      acknowledgedAt: null,
      resolvedAt: null,
      escalationLevel: 0,
    };
    db.insert(waiterCalls).values(row).run();
    return rowToWaiterCall(row);
  },

  getById(id: WaiterCallId): WaiterCall | null {
    const row = db.select().from(waiterCalls).where(eq(waiterCalls.id, id)).get();
    return row ? rowToWaiterCall(row) : null;
  },

  ack(id: WaiterCallId, employeeId: EmployeeId): WaiterCall {
    const now = clock.now();
    const result = db
      .update(waiterCalls)
      .set({ status: 'acknowledged', acknowledgedBy: employeeId, acknowledgedAt: now })
      .where(and(eq(waiterCalls.id, id), eq(waiterCalls.status, 'pending')))
      .run();
    if (result.changes === 0) {
      const cur = this.getById(id);
      if (!cur) throw new NotFoundError(`waiter call ${id} not found`);
      throw new ConflictError(`waiter call ${id} already in status ${cur.status}`);
    }
    return this.getByIdOrThrow(id);
  },

  resolve(id: WaiterCallId, employeeId: EmployeeId): WaiterCall {
    const now = clock.now();
    const result = db
      .update(waiterCalls)
      .set({ status: 'resolved', resolvedAt: now, acknowledgedBy: employeeId })
      .where(and(eq(waiterCalls.id, id), eq(waiterCalls.status, 'acknowledged')))
      .run();
    if (result.changes === 0) {
      const cur = this.getById(id);
      if (!cur) throw new NotFoundError(`waiter call ${id} not found`);
      throw new ConflictError(`waiter call ${id} cannot resolve from ${cur.status}`);
    }
    return this.getByIdOrThrow(id);
  },

  escalate(id: WaiterCallId): WaiterCall {
    const cur = this.getByIdOrThrow(id);
    if (cur.status !== 'pending') {
      throw new ConflictError(`only pending calls can escalate (current: ${cur.status})`);
    }
    if (cur.escalationLevel >= 2) {
      return cur;
    }
    db.update(waiterCalls)
      .set({ escalationLevel: cur.escalationLevel + 1, status: 'escalated' })
      .where(eq(waiterCalls.id, id))
      .run();
    return this.getByIdOrThrow(id);
  },

  listPending(tenantId: TenantId): WaiterCall[] {
    const rows = db
      .select()
      .from(waiterCalls)
      .where(
        and(eq(waiterCalls.tenantId, tenantId), inArray(waiterCalls.status, ACTIVE_STATUSES)),
      )
      .orderBy(desc(waiterCalls.createdAt))
      .all();
    return rows.map(rowToWaiterCall);
  },

  getByIdOrThrow(id: WaiterCallId): WaiterCall {
    const c = this.getById(id);
    if (!c) throw new NotFoundError(`waiter call ${id} not found`);
    return c;
  },
});

const rowToWaiterCall = (row: typeof waiterCalls.$inferSelect): WaiterCall =>
  WaiterCall.parse({
    ...row,
    obs: row.obs ?? undefined,
    acknowledgedBy: row.acknowledgedBy ?? undefined,
    acknowledgedAt: row.acknowledgedAt ?? undefined,
    resolvedAt: row.resolvedAt ?? undefined,
  });

export type WaiterRepo = ReturnType<typeof makeWaiterRepo>;
