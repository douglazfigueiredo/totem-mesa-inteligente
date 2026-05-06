import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
  ctx.repos.employees.create({
    tenantId: ctx.tenantId,
    nome: 'Cozinheiro PIN',
    pin: '1234',
    roles: ['cozinheiro'],
  });
  ctx.repos.employees.create({
    tenantId: ctx.tenantId,
    nome: 'Gerente PIN',
    pin: '9999',
    roles: ['gerente'],
  });
});
afterEach(async () => ctx.cleanup());

describe('POST /auth/pin', () => {
  it('aceita PIN valido e retorna employee', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/pin',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { pin: '1234' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.employee.nome).toBe('Cozinheiro PIN');
    expect(body.employee.roles).toEqual(['cozinheiro']);
  });

  it('PIN errado retorna 401', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/pin',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { pin: '0000' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('PIN com formato invalido retorna 422', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/pin',
      headers: { 'x-device-api-key': ctx.pairedDevices.kds.apiKey },
      payload: { pin: 'abcd' },
    });
    expect(res.statusCode).toBe(422);
  });

  it('rejeita sem device api key', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/auth/pin',
      payload: { pin: '1234' },
    });
    expect(res.statusCode).toBe(401);
  });
});
