import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cloudLink, tenants } from '../src/db/schema.js';
import { newTenantId } from '../src/lib/ids.js';
import { setupTestDB, type TestDB } from './setup.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('cloudLink.ensureTenantMirror', () => {
  it('é no-op quando hub está despareado', () => {
    ctx.repos.cloudLink.ensureTenantMirror();
    const all = ctx.db.select().from(tenants).all();
    expect(all).toHaveLength(1); // só o tenant local do setup
    expect(all[0]?.id).toBe(ctx.tenantId);
  });

  it('insere tenant espelho quando cloud_link existe mas tenant não', () => {
    const cloudTenantId = newTenantId();
    // Simula estado "pré-fix bd139d6": cloud_link existe sem tenant espelho.
    ctx.db
      .insert(cloudLink)
      .values({
        id: 'singleton',
        cloudBaseUrl: 'https://cloud.example.com',
        tenantId: cloudTenantId,
        tenantNome: 'Pizzaria Cloud',
        hubId: '00000000-0000-0000-0000-000000000001',
        hubNome: 'hub-test',
        apiKey: 'a'.repeat(64),
        pairedAt: ctx.clock.now(),
      })
      .run();

    expect(ctx.db.select().from(tenants).where(eq(tenants.id, cloudTenantId)).get()).toBeUndefined();

    ctx.repos.cloudLink.ensureTenantMirror();

    const mirrored = ctx.db.select().from(tenants).where(eq(tenants.id, cloudTenantId)).get();
    expect(mirrored).toBeDefined();
    expect(mirrored?.nome).toBe('Pizzaria Cloud');
    expect(mirrored?.slug).toBe(`cloud-${cloudTenantId.slice(0, 8)}`);
  });

  it('é idempotente — não duplica tenant em chamadas subsequentes', () => {
    const cloudTenantId = newTenantId();
    ctx.repos.cloudLink.set({
      cloudBaseUrl: 'https://cloud.example.com',
      tenantId: cloudTenantId,
      tenantNome: 'Pizzaria Cloud',
      hubId: '00000000-0000-0000-0000-000000000001',
      hubNome: 'hub-test',
      apiKey: 'a'.repeat(64),
    });

    const before = ctx.db.select().from(tenants).all().length;
    ctx.repos.cloudLink.ensureTenantMirror();
    ctx.repos.cloudLink.ensureTenantMirror();
    const after = ctx.db.select().from(tenants).all().length;

    expect(after).toBe(before);
  });
});
