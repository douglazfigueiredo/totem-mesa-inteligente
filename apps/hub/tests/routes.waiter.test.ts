import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

describe('POST /waiter/calls', () => {
  it('totem cria chamado', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/waiter/calls',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, reason: 'agua' },
    });
    expect(res.statusCode).toBe(201);
    const call = res.json();
    expect(call.status).toBe('pending');
    expect(call.reason).toBe('agua');
  });

  it('rejeita role kds', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/waiter/calls',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { tableId: ctx.tableId, reason: 'agua' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /waiter/calls/:id/ack', () => {
  it('garcom acknowledges chamado', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/waiter/calls',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, reason: 'agua' },
    });
    const callId = created.json().id;

    const res = await ctx.app.inject({
      method: 'POST',
      url: `/waiter/calls/${callId}/ack`,
      headers: { 'x-device-api-key': ctx.pairedDevices.waiter.apiKey },
      payload: { employeeId: ctx.employeeId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('acknowledged');
  });

  it('rejeita totem', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: `/waiter/calls/00000000-0000-7000-8000-000000000000/ack`,
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { employeeId: ctx.employeeId },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('POST /waiter/calls/:id/resolve', () => {
  it('resolve apos ack', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/waiter/calls',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, reason: 'fechar_conta' },
    });
    const callId = created.json().id;

    await ctx.app.inject({
      method: 'POST',
      url: `/waiter/calls/${callId}/ack`,
      headers: { 'x-device-api-key': ctx.pairedDevices.waiter.apiKey },
      payload: { employeeId: ctx.employeeId },
    });

    const res = await ctx.app.inject({
      method: 'POST',
      url: `/waiter/calls/${callId}/resolve`,
      headers: { 'x-device-api-key': ctx.pairedDevices.waiter.apiKey },
      payload: { employeeId: ctx.employeeId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('resolved');
  });

  it('resolve sem ack retorna 409', async () => {
    const created = await ctx.app.inject({
      method: 'POST',
      url: '/waiter/calls',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
      payload: { tableId: ctx.tableId, reason: 'talheres' },
    });
    const callId = created.json().id;

    const res = await ctx.app.inject({
      method: 'POST',
      url: `/waiter/calls/${callId}/resolve`,
      headers: { 'x-device-api-key': ctx.pairedDevices.waiter.apiKey },
      payload: { employeeId: ctx.employeeId },
    });
    expect(res.statusCode).toBe(409);
  });
});
