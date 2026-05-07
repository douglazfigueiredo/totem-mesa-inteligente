import { test as base, expect } from '@playwright/test';
import { config as loadEnv } from 'dotenv';
import { neon } from '@neondatabase/serverless';

loadEnv({ path: 'apps/cloud/.env.local' });
loadEnv({ path: 'apps/cloud/.env' });

if (!process.env.DATABASE_URL) {
  throw new Error('[e2e] DATABASE_URL não definido — copie de apps/cloud/.env.local');
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Limpa estado mutável do tenant E2E antes de cada teste,
 * preservando tenant + owner. Tabelas removidas em ordem reversa
 * de FK pra evitar constraint violations.
 */
async function cleanupTenant(tenantSlug: string) {
  const rows = (await sql`SELECT id FROM tenants WHERE slug = ${tenantSlug} LIMIT 1`) as Array<{
    id: string;
  }>;
  const tenantId = rows[0]?.id;
  if (!tenantId) return;

  await sql`DELETE FROM modifiers WHERE group_id IN (
    SELECT mg.id FROM modifier_groups mg JOIN products p ON mg.product_id = p.id WHERE p.tenant_id = ${tenantId}
  )`;
  await sql`DELETE FROM modifier_groups WHERE product_id IN (
    SELECT id FROM products WHERE tenant_id = ${tenantId}
  )`;
  await sql`DELETE FROM product_variants WHERE product_id IN (
    SELECT id FROM products WHERE tenant_id = ${tenantId}
  )`;
  await sql`DELETE FROM products WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM categories WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM tables WHERE tenant_id = ${tenantId}`;
  await sql`DELETE FROM employees WHERE tenant_id = ${tenantId}`;
}

type Fixtures = {
  cleanDb: void;
};

export const test = base.extend<Fixtures>({
  cleanDb: [
    async ({}, use) => {
      await cleanupTenant('dev');
      await use();
    },
    { auto: true },
  ],
});

export { expect };
