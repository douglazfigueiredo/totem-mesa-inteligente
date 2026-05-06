import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

const createOrder = async () => {
  const res = await ctx.app.inject({
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
  return res.json();
};

describe('POST /prep/start', () => {
  it('cria preparo + atualiza status order para preparando', async () => {
    const order = await createOrder();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/prep/start',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: {
        orderId: order.id,
        employeeId: ctx.employeeId,
        durationSec: 1320,
      },
    });
    expect(res.statusCode).toBe(201);
    const preparo = res.json();
    expect(preparo.status).toBe('preparando');
    expect(preparo.startedAt).toBe(ctx.clock.now());

    const updated = ctx.repos.orders.getByIdOrThrow(order.id);
    expect(updated.status).toBe('preparando');
  });

  it('rejeita role totem', async () => {
    const order = await createOrder();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/prep/start',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: {
        orderId: order.id,
        employeeId: ctx.employeeId,
        durationSec: 1320,
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('start 2x no mesmo order retorna 409 (race)', async () => {
    const order = await createOrder();
    await ctx.app.inject({
      method: 'POST',
      url: '/prep/start',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: {
        orderId: order.id,
        employeeId: ctx.employeeId,
        durationSec: 1320,
      },
    });
    const second = await ctx.app.inject({
      method: 'POST',
      url: '/prep/start',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: {
        orderId: order.id,
        employeeId: ctx.employeeId,
        durationSec: 1320,
      },
    });
    expect(second.statusCode).toBe(409);
  });

  it('marca pronto + atualiza order para pronto', async () => {
    const order = await createOrder();
    const start = await ctx.app.inject({
      method: 'POST',
      url: '/prep/start',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: {
        orderId: order.id,
        employeeId: ctx.employeeId,
        durationSec: 30,
      },
    });
    const preparo = start.json();
    ctx.clock.advance(35_000);

    const ready = await ctx.app.inject({
      method: 'POST',
      url: `/prep/${preparo.id}/ready`,
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
    });
    expect(ready.statusCode).toBe(200);
    expect(ready.json().status).toBe('pronto');

    const updated = ctx.repos.orders.getByIdOrThrow(order.id);
    expect(updated.status).toBe('pronto');
  });
});
