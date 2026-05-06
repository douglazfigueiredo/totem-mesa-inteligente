import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

describe('POST /admin/pairing-codes', () => {
  it('exige x-admin-secret', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      payload: { role: 'totem' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('cria codigo de 6 digitos com secret valido', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: { role: 'kds' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.code).toMatch(/^\d{6}$/);
    expect(body.role).toBe('kds');
  });

  it('rejeita secret invalido', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      headers: { 'x-admin-secret': 'wrong' },
      payload: { role: 'totem' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /devices/pair', () => {
  it('emparelha totem e retorna apiKey', async () => {
    const codeRes = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: { role: 'totem' },
    });
    const { code } = codeRes.json();

    const pairRes = await ctx.app.inject({
      method: 'POST',
      url: '/devices/pair',
      payload: { code, nome: 'Totem Mesa 8', tableId: ctx.tableId },
    });
    expect(pairRes.statusCode).toBe(201);
    const body = pairRes.json();
    expect(body.device.role).toBe('totem');
    expect(body.device.tableId).toBe(ctx.tableId);
    expect(body.apiKey.length).toBeGreaterThan(20);
  });

  it('totem sem tableId retorna 422', async () => {
    const codeRes = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: { role: 'totem' },
    });
    const { code } = codeRes.json();

    const pairRes = await ctx.app.inject({
      method: 'POST',
      url: '/devices/pair',
      payload: { code, nome: 'Totem' },
    });
    expect(pairRes.statusCode).toBe(422);
  });

  it('codigo expirado retorna 409', async () => {
    const codeRes = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: { role: 'kds', ttlMs: 5_000 },
    });
    const { code } = codeRes.json();
    ctx.clock.advance(10_000);

    const pairRes = await ctx.app.inject({
      method: 'POST',
      url: '/devices/pair',
      payload: { code, nome: 'KDS' },
    });
    expect(pairRes.statusCode).toBe(409);
  });

  it('codigo ja consumido retorna 409', async () => {
    const codeRes = await ctx.app.inject({
      method: 'POST',
      url: '/admin/pairing-codes',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: { role: 'kds' },
    });
    const { code } = codeRes.json();
    await ctx.app.inject({
      method: 'POST',
      url: '/devices/pair',
      payload: { code, nome: 'KDS 1' },
    });
    const second = await ctx.app.inject({
      method: 'POST',
      url: '/devices/pair',
      payload: { code, nome: 'KDS 2' },
    });
    expect(second.statusCode).toBe(409);
  });
});
