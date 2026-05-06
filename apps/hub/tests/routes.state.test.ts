import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

describe('POST /state/sync', () => {
  it('retorna snapshot vazio quando mesa nao tem atividade', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/state/sync',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.activeOrders).toEqual([]);
    expect(body.activePreparos).toEqual([]);
    expect(body.pendingWaiterCalls).toEqual([]);
    expect(typeof body.serverTime).toBe('number');
  });

  it('retorna pedidos ativos + preparos + chamados pendentes', async () => {
    const orderRes = await ctx.app.inject({
      method: 'POST',
      url: '/orders',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: {
        tableId: ctx.tableId,
        items: [
          {
            productId: randomUUID(),
            nome: 'Pizza',
            destino: 'cozinha',
            qty: 1,
            unitPriceCents: 4500,
            totalPriceCents: 4500,
            tempoEstimadoSec: 1320,
          },
        ],
      },
    });
    const orderId = orderRes.json().id;

    await ctx.app.inject({
      method: 'POST',
      url: '/prep/start',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { orderId, employeeId: ctx.employeeId, durationSec: 1320 },
    });

    await ctx.app.inject({
      method: 'POST',
      url: '/waiter/calls',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, reason: 'agua' },
    });

    const sync = await ctx.app.inject({
      method: 'POST',
      url: '/state/sync',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId },
    });
    const body = sync.json();
    expect(body.activeOrders).toHaveLength(1);
    expect(body.activePreparos).toHaveLength(1);
    expect(body.pendingWaiterCalls).toHaveLength(1);
  });
});

describe('POST /heartbeat', () => {
  it('retorna serverTime + driftMs', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/heartbeat',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { clientTime: Date.now() - 500 },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.deviceId).toBe(ctx.pairedDevices.kds.id);
    expect(typeof body.serverTime).toBe('number');
    expect(body.driftMs).toBeGreaterThanOrEqual(0);
  });

  it('rejeita sem auth', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/heartbeat',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });
});
