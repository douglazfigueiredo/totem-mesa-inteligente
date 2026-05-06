import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';
import { newEventId } from '../src/lib/ids.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

const orderItem = (overrides: Partial<Record<string, unknown>> = {}) => ({
  productId: randomUUID(),
  nome: 'Pizza Margherita G',
  destino: 'cozinha' as const,
  qty: 1,
  unitPriceCents: 4500,
  totalPriceCents: 4500,
  tempoEstimadoSec: 1320,
  ...overrides,
});

describe('POST /orders', () => {
  it('rejeita sem x-device-api-key', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      payload: { tableId: ctx.tableId, items: [orderItem()] },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejeita role kds', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { tableId: ctx.tableId, items: [orderItem()] },
    });
    expect(res.statusCode).toBe(403);
  });

  it('cria pedido com role totem', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: {
        tableId: ctx.tableId,
        items: [orderItem({ qty: 2, totalPriceCents: 9000 })],
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.status).toBe('criado');
    expect(body.subtotalCents).toBe(9000);
    expect(body.taxaServicoBps).toBe(1000);
    expect(body.taxaServicoCents).toBe(900);
    expect(body.totalCents).toBe(9900);
    expect(body.items[0].id).toBeDefined();
  });

  it('totalPriceCents != qty * unitPriceCents retorna 422', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: {
        tableId: ctx.tableId,
        items: [orderItem({ qty: 2, totalPriceCents: 4500 })],
      },
    });
    expect(res.statusCode).toBe(422);
  });

  it('idempotencia via x-event-id retorna mesmo pedido', async () => {
    const eventId = newEventId();
    const r1 = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: {
        'x-device-api-key': ctx.pairedDevices.totem.apiKey,
        'x-event-id': eventId,
      },
      payload: { tableId: ctx.tableId, items: [orderItem()] },
    });
    const r2 = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: {
        'x-device-api-key': ctx.pairedDevices.totem.apiKey,
        'x-event-id': eventId,
      },
      payload: { tableId: ctx.tableId, items: [orderItem({ qty: 5 })] },
    });
    expect(r1.statusCode).toBe(201);
    expect(r2.statusCode).toBe(200);
    expect(r1.json().id).toBe(r2.json().id);
    expect(ctx.repos.orders.count()).toBe(1);
  });

  it('enqueue evento order:created no outbox', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, items: [orderItem()] },
    });
    expect(ctx.repos.outbox.pendingCount()).toBe(1);
    const pending = ctx.repos.outbox.listPending();
    expect(pending[0]?.type).toBe('order:created');
  });
});

describe('GET /orders/:id', () => {
  it('retorna pedido autenticado', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, items: [orderItem()] },
    });
    const { id } = created.json();
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/orders/${id}`,
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(id);
  });

  it('id inexistente retorna 404', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/orders/${randomUUID()}`,
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
    });
    expect(res.statusCode).toBe(404);
  });
});
