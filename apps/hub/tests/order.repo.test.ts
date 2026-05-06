import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { newOrderItemId, newOrderId } from '../src/lib/ids.js';
import { ProductId, type OrderItem } from '@app/schemas';
import { randomUUID } from 'node:crypto';

let ctx: TestDB;

const makeItems = (): OrderItem[] => [
  {
    id: newOrderItemId(),
    productId: ProductId.parse(randomUUID()),
    nome: 'Pizza Margherita G',
    destino: 'cozinha',
    qty: 1,
    unitPriceCents: 4500,
    totalPriceCents: 4500,
    tempoEstimadoSec: 1320,
  },
];

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('OrderRepo', () => {
  it('cria pedido com itens e calcula campos', () => {
    const order = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: makeItems(),
      subtotalCents: 4500,
      taxaServicoBps: 1000,
      taxaServicoCents: 450,
      totalCents: 4950,
    });
    expect(order.status).toBe('criado');
    expect(order.items).toHaveLength(1);
    expect(order.totalCents).toBe(4950);
    expect(order.createdAt).toBe(ctx.clock.now());
  });

  it('getById retorna o pedido', () => {
    const created = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: makeItems(),
      subtotalCents: 4500,
      taxaServicoBps: 1000,
      taxaServicoCents: 450,
      totalCents: 4950,
    });
    const fetched = ctx.repos.orders.getById(created.id);
    expect(fetched?.id).toBe(created.id);
  });

  it('updateStatus para enviado seta sentAt', () => {
    const created = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: makeItems(),
      subtotalCents: 4500,
      taxaServicoBps: 0,
      taxaServicoCents: 0,
      totalCents: 4500,
    });
    ctx.clock.advance(1_500);
    const updated = ctx.repos.orders.updateStatus(created.id, 'enviado');
    expect(updated.status).toBe('enviado');
    expect(updated.sentAt).toBe(ctx.clock.now());
  });

  it('listActiveByTable filtra por status ativos', () => {
    const a = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: makeItems(),
      subtotalCents: 4500,
      taxaServicoBps: 0,
      taxaServicoCents: 0,
      totalCents: 4500,
    });
    const b = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: makeItems(),
      subtotalCents: 4500,
      taxaServicoBps: 0,
      taxaServicoCents: 0,
      totalCents: 4500,
    });
    ctx.repos.orders.cancel(b.id, 'cliente desistiu');
    const active = ctx.repos.orders.listActiveByTable(ctx.tableId);
    expect(active.map((o) => o.id)).toContain(a.id);
    expect(active.map((o) => o.id)).not.toContain(b.id);
  });

  it('cancel marca status e reason', () => {
    const created = ctx.repos.orders.create({
      tenantId: ctx.tenantId,
      tableId: ctx.tableId,
      destino: 'cozinha',
      items: makeItems(),
      subtotalCents: 4500,
      taxaServicoBps: 0,
      taxaServicoCents: 0,
      totalCents: 4500,
    });
    const cancelled = ctx.repos.orders.cancel(created.id, 'item esgotou');
    expect(cancelled.status).toBe('cancelado');
    expect(cancelled.cancelReason).toBe('item esgotou');
    expect(cancelled.cancelledAt).toBe(ctx.clock.now());
  });

  it('updateStatus em order inexistente lanca NotFoundError', () => {
    expect(() => ctx.repos.orders.updateStatus(newOrderId(), 'enviado')).toThrow(/not found/);
  });
});
