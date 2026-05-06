import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

describe('GET /health', () => {
  it('retorna status ok sem autenticacao', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
    expect(body.db.ordersCount).toBe(0);
    expect(body.outbox.pending).toBe(0);
  });
});
