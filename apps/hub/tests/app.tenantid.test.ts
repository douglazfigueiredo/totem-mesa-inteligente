import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { makeMemoryBroadcaster } from '../src/lib/broadcaster.js';
import { setupTestDB, type TestDB } from './setup.js';
import { newTenantId } from '../src/lib/ids.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('app.tenantId getter', () => {
  it('retorna tenantId local quando hub esta unpaired', async () => {
    const app = await buildApp({
      repos: ctx.repos,
      tenantId: ctx.tenantId,
      broadcaster: makeMemoryBroadcaster(),
      adminSecret: 'test-admin-secret-must-be-long-enough',
      logger: false,
    });
    await app.ready();
    expect(app.tenantId).toBe(ctx.tenantId);
    await app.close();
  });

  it('retorna tenantId do cloud quando hub se pareia depois do boot', async () => {
    const app = await buildApp({
      repos: ctx.repos,
      tenantId: ctx.tenantId,
      broadcaster: makeMemoryBroadcaster(),
      adminSecret: 'test-admin-secret-must-be-long-enough',
      logger: false,
    });
    await app.ready();
    expect(app.tenantId).toBe(ctx.tenantId);

    const cloudTenantId = newTenantId();
    ctx.repos.cloudLink.set({
      cloudBaseUrl: 'https://cloud.example.com',
      tenantId: cloudTenantId,
      tenantNome: 'Cloud Tenant',
      hubId: '00000000-0000-0000-0000-000000000001',
      hubNome: 'hub-test',
      apiKey: 'a'.repeat(64),
    });

    expect(app.tenantId).toBe(cloudTenantId);

    ctx.repos.cloudLink.clear();
    expect(app.tenantId).toBe(ctx.tenantId);

    await app.close();
  });
});
