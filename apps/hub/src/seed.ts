import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { argv } from 'node:process';
import { eq } from 'drizzle-orm';
import { CatalogSnapshot, type TenantId } from '@app/schemas';
import { createDB } from './db/index.js';
import { tenants } from './db/schema.js';
import { systemClock } from './lib/clock.js';
import { hashPin } from './repositories/employee.repo.js';
import { newEmployeeId } from './lib/ids.js';
import { employees } from './db/schema.js';
import { makeRepos } from './repositories/index.js';
import { mkdirSync } from 'node:fs';

const path = argv[2] ?? './seeds/pizzaria-dev.json';
const dbPath = process.env.DATABASE_PATH ?? './data/hub.db';
mkdirSync(dirname(dbPath), { recursive: true });

const { db, close } = createDB({
  path: dbPath,
  applyMigrations: true,
  migrationsFolder: new URL('./db/migrations', import.meta.url).pathname,
});

const tenant = db.select().from(tenants).limit(1).get();
if (!tenant) {
  console.error('[seed] nao ha tenant — rode `pnpm dev` ou `pnpm start` primeiro para bootstrap');
  process.exit(1);
}

const tenantId = tenant.id as TenantId;
const raw = JSON.parse(readFileSync(path, 'utf-8')) as {
  version: number;
  categories: Array<Record<string, unknown>>;
  products: Array<Record<string, unknown>>;
};

const enriched = {
  tenantId,
  version: raw.version,
  generatedAt: systemClock.now(),
  categories: raw.categories.map((c) => ({ ...c, tenantId })),
  products: raw.products.map((p) => ({ ...p, tenantId, createdAt: systemClock.now(), updatedAt: systemClock.now() })),
};

const snapshot = CatalogSnapshot.parse(enriched);
const repos = makeRepos(db, systemClock);
repos.catalog.replace(snapshot);

console.log(
  `[seed] catalogo v${snapshot.version} instalado: ${snapshot.categories.length} categorias, ${snapshot.products.length} produtos`,
);

const existingEmployees = db.select().from(employees).limit(1).get();
if (!existingEmployees) {
  const cozinheiroId = newEmployeeId();
  const garcomId = newEmployeeId();
  const gerenteId = newEmployeeId();
  const now = systemClock.now();
  db.insert(employees).values([
    {
      id: cozinheiroId,
      tenantId,
      nome: 'Cozinheiro Dev',
      pinHash: hashPin('1111'),
      roles: ['cozinheiro'],
      isActive: true,
      createdAt: now,
    },
    {
      id: garcomId,
      tenantId,
      nome: 'Garcom Dev',
      pinHash: hashPin('2222'),
      roles: ['garcom'],
      isActive: true,
      createdAt: now,
    },
    {
      id: gerenteId,
      tenantId,
      nome: 'Gerente Dev',
      pinHash: hashPin('9999'),
      roles: ['gerente'],
      isActive: true,
      createdAt: now,
    },
  ]).run();
  console.log('[seed] funcionarios dev criados:');
  console.log('  cozinheiro PIN 1111');
  console.log('  garcom     PIN 2222');
  console.log('  gerente    PIN 9999');
} else {
  console.log('[seed] funcionarios ja existem — pulando');
}

close();
