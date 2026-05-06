import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { orders } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newOrderId } from '../lib/ids.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import {
  Order,
  type OrderId,
  type OrderItem,
  type OrderStatus,
  type TableId,
  type TenantId,
} from '@app/schemas';

const ACTIVE_STATUSES: OrderStatus[] = ['criado', 'enviado', 'preparando', 'pronto'];

export type CreateOrderInput = {
  tenantId: TenantId;
  tableId: TableId;
  items: OrderItem[];
  destino: 'cozinha' | 'garcom' | 'ambos';
  subtotalCents: number;
  taxaServicoBps: number;
  taxaServicoCents: number;
  totalCents: number;
  obs?: string;
  id?: OrderId;
};

export const makeOrderRepo = (db: DBClient, clock: Clock) => ({
  create(input: CreateOrderInput): Order {
    const id = input.id ?? (newOrderId() as OrderId);
    const now = clock.now();

    const row = {
      id,
      tenantId: input.tenantId,
      tableId: input.tableId,
      status: 'criado' as const satisfies OrderStatus,
      destino: input.destino,
      items: input.items,
      subtotalCents: input.subtotalCents,
      taxaServicoBps: input.taxaServicoBps,
      taxaServicoCents: input.taxaServicoCents,
      totalCents: input.totalCents,
      obs: input.obs ?? null,
      createdAt: now,
      sentAt: null,
      cancelledAt: null,
      cancelReason: null,
    };

    db.insert(orders).values(row).run();
    return Order.parse({
      ...row,
      obs: row.obs ?? undefined,
      sentAt: row.sentAt ?? undefined,
      cancelledAt: row.cancelledAt ?? undefined,
      cancelReason: row.cancelReason ?? undefined,
    });
  },

  getById(id: OrderId): Order | null {
    const row = db.select().from(orders).where(eq(orders.id, id)).get();
    return row ? rowToOrder(row) : null;
  },

  listActiveByTable(tableId: TableId): Order[] {
    const rows = db
      .select()
      .from(orders)
      .where(and(eq(orders.tableId, tableId), inArray(orders.status, ACTIVE_STATUSES)))
      .orderBy(desc(orders.createdAt))
      .all();
    return rows.map(rowToOrder);
  },

  listActiveByTenant(tenantId: TenantId): Order[] {
    const rows = db
      .select()
      .from(orders)
      .where(and(eq(orders.tenantId, tenantId), inArray(orders.status, ACTIVE_STATUSES)))
      .orderBy(desc(orders.createdAt))
      .all();
    return rows.map(rowToOrder);
  },

  updateStatus(id: OrderId, next: OrderStatus): Order {
    const now = clock.now();
    const sentAtPatch = next === 'enviado' ? { sentAt: now } : {};
    const result = db
      .update(orders)
      .set({ status: next, ...sentAtPatch })
      .where(eq(orders.id, id))
      .run();
    if (result.changes === 0) throw new NotFoundError(`order ${id} not found`);
    return this.getByIdOrThrow(id);
  },

  cancel(id: OrderId, reason: string): Order {
    const current = this.getById(id);
    if (!current) throw new NotFoundError(`order ${id} not found`);
    if (current.status === 'entregue') {
      throw new ConflictError('cannot cancel delivered order');
    }
    db.update(orders)
      .set({ status: 'cancelado', cancelledAt: clock.now(), cancelReason: reason })
      .where(eq(orders.id, id))
      .run();
    return this.getByIdOrThrow(id);
  },

  getByIdOrThrow(id: OrderId): Order {
    const o = this.getById(id);
    if (!o) throw new NotFoundError(`order ${id} not found`);
    return o;
  },

  count(): number {
    const r = db.select({ c: sql<number>`count(*)` }).from(orders).get();
    return r?.c ?? 0;
  },
});

const rowToOrder = (row: typeof orders.$inferSelect): Order =>
  Order.parse({
    ...row,
    obs: row.obs ?? undefined,
    sentAt: row.sentAt ?? undefined,
    cancelledAt: row.cancelledAt ?? undefined,
    cancelReason: row.cancelReason ?? undefined,
  });

export type OrderRepo = ReturnType<typeof makeOrderRepo>;
