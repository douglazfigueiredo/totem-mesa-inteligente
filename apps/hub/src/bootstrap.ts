import { eq } from 'drizzle-orm';
import { tenants, tables } from './db/schema.js';
import type { DBClient } from './db/index.js';
import type { Clock } from './lib/clock.js';
import { newTableId, newTenantId } from './lib/ids.js';
import { Slug, Vertical, type TenantId } from '@app/schemas';

export type BootstrapEnv = {
  TENANT_ID?: string;
  TENANT_SLUG?: string;
  TENANT_NAME?: string;
  TENANT_VERTICAL?: string;
  TENANT_TABLES?: string;
};

export type BootstrapResult = {
  tenantId: TenantId;
  created: boolean;
};

export const bootstrap = (
  db: DBClient,
  clock: Clock,
  env: BootstrapEnv = process.env,
): BootstrapResult => {
  const explicitId = env.TENANT_ID;

  const existing = explicitId
    ? db.select().from(tenants).where(eq(tenants.id, explicitId)).get()
    : db.select().from(tenants).limit(1).get();

  if (existing) {
    return { tenantId: existing.id as TenantId, created: false };
  }

  const tenantId = (explicitId ?? newTenantId()) as TenantId;
  const slug = Slug.parse(env.TENANT_SLUG ?? 'loja-padrao');
  const nome = env.TENANT_NAME ?? 'Loja Padrao';
  const vertical = Vertical.parse(env.TENANT_VERTICAL ?? 'pizzaria');
  const tableCount = Math.max(1, Math.min(99, Number(env.TENANT_TABLES ?? 10)));
  const now = clock.now();

  db.insert(tenants)
    .values({
      id: tenantId,
      slug,
      nome,
      vertical,
      features: {
        mesas: true,
        comanda: false,
        balcao: false,
        retirada: false,
        delivery: false,
        pizzaMetade: vertical === 'pizzaria',
        combo: false,
      },
      timezone: 'America/Sao_Paulo',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  for (let i = 1; i <= tableCount; i++) {
    db.insert(tables)
      .values({
        id: newTableId(),
        tenantId,
        numero: i,
        capacidade: 4,
        status: 'livre',
      })
      .run();
  }

  return { tenantId, created: true };
};
