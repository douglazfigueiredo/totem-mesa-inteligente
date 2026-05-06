import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { startTimerWorker } from '../src/workers/timer.js';
import { makeMemoryBroadcaster } from '../src/lib/broadcaster.js';
import { newOrderItemId } from '../src/lib/ids.js';
import { ProductId } from '@app/schemas';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

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
        tempoEstimadoSec: 30,
      },
    ],
    subtotalCents: 4500,
    taxaServicoBps: 0,
    taxaServicoCents: 0,
    totalCents: 4500,
  });

describe('timer worker', () => {
  it('marca preparo pronto quando expira + broadcast prep:ready', async () => {
    const order = newOrder();
    const preparo = ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 30,
    });

    const broadcaster = makeMemoryBroadcaster();
    const worker = startTimerWorker({
      repos: ctx.repos,
      broadcaster,
      intervalMs: 60_000,
    });

    await worker.tick();
    expect(broadcaster.events).toHaveLength(0);
    expect(ctx.repos.preparos.getById(preparo.id)?.status).toBe('preparando');

    ctx.clock.advance(31_000);
    await worker.tick();

    expect(broadcaster.events).toHaveLength(1);
    expect(broadcaster.events[0]?.type).toBe('prep:ready');

    const updated = ctx.repos.preparos.getById(preparo.id);
    expect(updated?.status).toBe('pronto');

    const orderUpdated = ctx.repos.orders.getByIdOrThrow(order.id);
    expect(orderUpdated.status).toBe('pronto');

    expect(ctx.repos.outbox.pendingCount()).toBe(1);

    await worker.stop();
  });

  it('idempotente — tick depois de pronto nao re-emite', async () => {
    const order = newOrder();
    const preparo = ctx.repos.preparos.start({
      orderId: order.id,
      employeeId: ctx.employeeId,
      durationSec: 30,
    });
    ctx.clock.advance(31_000);

    const broadcaster = makeMemoryBroadcaster();
    const worker = startTimerWorker({
      repos: ctx.repos,
      broadcaster,
      intervalMs: 60_000,
    });

    await worker.tick();
    expect(broadcaster.events).toHaveLength(1);

    await worker.tick();
    await worker.tick();
    expect(broadcaster.events).toHaveLength(1);
    expect(ctx.repos.preparos.getById(preparo.id)?.status).toBe('pronto');

    await worker.stop();
  });
});
