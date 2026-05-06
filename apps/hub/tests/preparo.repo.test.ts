import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { newOrderId, newOrderItemId } from '../src/lib/ids.js';
import { computeRemainingSec, ProductId, type OrderItem } from '@app/schemas';
import { randomUUID } from 'node:crypto';

let ctx: TestDB;

const newOrder = () =>
  ctx.repos.orders.create({
    tenantId: ctx.tenantId,
    tableId: ctx.tableId,
    destino: 'cozinha',
    items: [
      {
        id: newOrderItemId(),
        productId: ProductId.parse(randomUUID()),
        nome: 'Pizza',
        destino: 'cozinha',
        qty: 1,
        unitPriceCents: 4500,
        totalPriceCents: 4500,
        tempoEstimadoSec: 1320,
      } satisfies OrderItem,
    ],
    subtotalCents: 4500,
    taxaServicoBps: 0,
    taxaServicoCents: 0,
    totalCents: 4500,
  });

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('PreparoRepo', () => {
  it('start cria preparo com startedAt = clock.now()', () => {
    const order = newOrder();
    const preparo = ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 1320,
    });
    expect(preparo.status).toBe('preparando');
    expect(preparo.startedAt).toBe(ctx.clock.now());
    expect(preparo.durationSec).toBe(1320);
    expect(preparo.startedByEmployeeId).toBe(ctx.employeeId);
  });

  it('start 2x no mesmo order lanca ConflictError', () => {
    const order = newOrder();
    ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 1320,
    });
    expect(() =>
      ctx.repos.preparos.start({
        orderId: order.id,
        employeeId: ctx.employeeId,
        durationSec: 1320,
      }),
    ).toThrow(/already exists/);
  });

  it('computeRemainingSec funciona com clock', () => {
    const order = newOrder();
    const preparo = ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 60,
    });
    expect(computeRemainingSec(preparo, ctx.clock.now())).toBe(60);
    ctx.clock.advance(20_000);
    expect(computeRemainingSec(preparo, ctx.clock.now())).toBe(40);
    ctx.clock.advance(40_000);
    expect(computeRemainingSec(preparo, ctx.clock.now())).toBe(0);
    ctx.clock.advance(10_000);
    expect(computeRemainingSec(preparo, ctx.clock.now())).toBe(0);
  });

  it('listDue retorna preparos com tempo expirado', () => {
    const order = newOrder();
    ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 30,
    });
    expect(ctx.repos.preparos.listDue()).toHaveLength(0);
    ctx.clock.advance(31_000);
    expect(ctx.repos.preparos.listDue()).toHaveLength(1);
  });

  it('markReady atualiza status e readyAt', () => {
    const order = newOrder();
    const preparo = ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 30,
    });
    ctx.clock.advance(35_000);
    const ready = ctx.repos.preparos.markReady(preparo.id);
    expect(ready.status).toBe('pronto');
    expect(ready.readyAt).toBe(ctx.clock.now());
  });

  it('markReady 2x lanca ConflictError', () => {
    const order = newOrder();
    const preparo = ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 30,
    });
    ctx.repos.preparos.markReady(preparo.id);
    expect(() => ctx.repos.preparos.markReady(preparo.id)).toThrow(/already in status/);
  });
});
