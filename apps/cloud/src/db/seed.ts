import { config as loadEnv } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const TENANT_SLUG = 'dev';
const TENANT_NOME = 'Pizzaria Dev';
const DEFAULT_OWNER_EMAIL = 'douglasarts@gmail.com';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL é obrigatório (veja .env.example)');
  }
  const ownerEmail = (process.env.EMAIL_DEV_OWNER ?? DEFAULT_OWNER_EMAIL).trim().toLowerCase();

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log('[seed] tenant slug=%s nome=%s', TENANT_SLUG, TENANT_NOME);
  console.log('[seed] owner email=%s', ownerEmail);

  const [tenant] = await db
    .insert(schema.tenants)
    .values({ slug: TENANT_SLUG, nome: TENANT_NOME, vertical: 'pizzaria' })
    .onConflictDoUpdate({
      target: schema.tenants.slug,
      set: { nome: TENANT_NOME, updatedAt: new Date() },
    })
    .returning();

  const [owner] = await db
    .insert(schema.owners)
    .values({ email: ownerEmail })
    .onConflictDoUpdate({ target: schema.owners.email, set: { email: ownerEmail } })
    .returning();

  const existing = await db
    .select()
    .from(schema.tenantOwners)
    .where(
      and(
        eq(schema.tenantOwners.tenantId, tenant.id),
        eq(schema.tenantOwners.ownerId, owner.id),
      ),
    );

  if (existing.length === 0) {
    await db.insert(schema.tenantOwners).values({
      tenantId: tenant.id,
      ownerId: owner.id,
      role: 'owner',
    });
    console.log('[seed] ✓ owner vinculado ao tenant');
  } else {
    console.log('[seed] = owner já vinculado, ok');
  }

  // Hub dev (opt-in via env DEV_HUB_API_KEY) — útil pra testar
  // o endpoint /api/catalog/snapshot antes da fase 6D estar pronta.
  const devHubKey = process.env.DEV_HUB_API_KEY?.trim();
  if (devHubKey && devHubKey.length >= 16) {
    await db
      .insert(schema.hubs)
      .values({
        tenantId: tenant.id,
        nome: 'hub-dev',
        apiKey: devHubKey,
      })
      .onConflictDoUpdate({
        target: schema.hubs.apiKey,
        set: { tenantId: tenant.id, nome: 'hub-dev' },
      });
    console.log('[seed] ✓ hub dev pareado (apiKey: %s…)', devHubKey.slice(0, 8));
  } else {
    console.log('[seed] = DEV_HUB_API_KEY não setado, pulando hub dev');
  }

  console.log('[seed] ✓ pronto. tenant=%s owner=%s', tenant.id, owner.id);
}

main().catch((err) => {
  console.error('[seed] falhou:', err);
  process.exit(1);
});
