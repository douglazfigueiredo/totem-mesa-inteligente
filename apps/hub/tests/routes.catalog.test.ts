import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestApp, type TestApp } from './app.setup.js';

let ctx: TestApp;

const sampleSnapshot = (tenantId: string) => ({
  tenantId,
  version: 1,
  generatedAt: 1700000000000,
  categories: [
    {
      id: '00000000-0000-7000-8000-000000000001',
      tenantId,
      nome: 'Pizzas',
      ordem: 0,
      isActive: true,
    },
  ],
  products: [
    {
      id: '00000000-0000-7000-8000-000000000101',
      tenantId,
      categoryId: '00000000-0000-7000-8000-000000000001',
      nome: 'Pizza Margherita',
      basePriceCents: 4500,
      destino: 'cozinha' as const,
      tempoEstimadoSec: 1320,
      isAvailable: true,
      isVegetarian: true,
      isGlutenFree: false,
      verticalConfig: { tipo: 'pizza' as const, saboresMax: 2, bordaRecheadaDisponivel: true },
      variants: [],
      modifierGroups: [],
      createdAt: 1700000000000,
      updatedAt: 1700000000000,
    },
  ],
});

beforeEach(async () => {
  ctx = await setupTestApp();
});
afterEach(async () => ctx.cleanup());

describe('POST /admin/catalog', () => {
  it('admin instala catalogo', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/admin/catalog',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: sampleSnapshot(ctx.tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.version).toBe(1);
    expect(body.productsCount).toBe(1);
  });

  it('rejeita sem admin secret', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/admin/catalog',
      payload: sampleSnapshot(ctx.tenantId),
    });
    expect(res.statusCode).toBe(401);
  });

  it('replace incrementa versao', async () => {
    await ctx.app.inject({
      method: 'POST',
      url: '/admin/catalog',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: sampleSnapshot(ctx.tenantId),
    });
    const v2 = sampleSnapshot(ctx.tenantId);
    v2.version = 2;
    await ctx.app.inject({
      method: 'POST',
      url: '/admin/catalog',
      headers: { 'x-admin-secret': ctx.adminSecret },
      payload: v2,
    });
    expect(ctx.repos.catalog.getVersion(ctx.tenantId)).toBe(2);
  });
});

describe('GET /catalog', () => {
  it('retorna 404 quando nao seedado', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/catalog',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
    });
    expect(res.statusCode).toBe(404);
  });

  it('retorna snapshot apos seed', async () => {
    ctx.repos.catalog.replace(sampleSnapshot(ctx.tenantId));
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/catalog',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers.etag).toBe('"v1"');
    const body = res.json();
    expect(body.version).toBe(1);
    expect(body.products).toHaveLength(1);
  });

  it('retorna 304 com If-None-Match', async () => {
    ctx.repos.catalog.replace(sampleSnapshot(ctx.tenantId));
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/catalog',
      headers: {
        'x-device-api-key': ctx.pairedDevices.totem.apiKey,
        'if-none-match': '"v1"',
      },
    });
    expect(res.statusCode).toBe(304);
  });

  it('GET /catalog/version retorna versao atual', async () => {
    ctx.repos.catalog.replace(sampleSnapshot(ctx.tenantId));
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/catalog/version',
      headers: { 'x-device-api-key': ctx.pairedDevices.totem.apiKey },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().version).toBe(1);
  });
});
