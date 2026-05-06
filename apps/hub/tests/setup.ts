import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDB, type DBClient } from '../src/db/index.js';
import { fixedClock } from '../src/lib/clock.js';
import { newTenantId, newTableId, newEmployeeId } from '../src/lib/ids.js';
import { makeRepos, type Repos } from '../src/repositories/index.js';
import { tenants, tables, employees } from '../src/db/schema.js';
import type { TenantId, TableId, EmployeeId } from '@app/schemas';

const MIGRATIONS_FOLDER = fileURLToPath(new URL('../src/db/migrations', import.meta.url));

export type TestDB = {
  db: DBClient;
  repos: Repos;
  clock: ReturnType<typeof fixedClock>;
  tenantId: TenantId;
  tableId: TableId;
  employeeId: EmployeeId;
  cleanup: () => void;
};

export const setupTestDB = (now = 1_700_000_000_000): TestDB => {
  const dir = mkdtempSync(join(tmpdir(), 'tm-hub-test-'));
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'test.db');

  const { db, close } = createDB({
    path,
    applyMigrations: true,
    migrationsFolder: MIGRATIONS_FOLDER,
  });

  const clock = fixedClock(now);
  const repos = makeRepos(db, clock);

  const tenantId = newTenantId();
  const tableId = newTableId();
  const employeeId = newEmployeeId();

  db.insert(tenants)
    .values({
      id: tenantId,
      slug: 'test-tenant',
      nome: 'Test Tenant',
      vertical: 'pizzaria',
      features: {
        mesas: true,
        comanda: false,
        balcao: false,
        retirada: false,
        delivery: false,
        pizzaMetade: true,
        combo: false,
      },
      timezone: 'America/Sao_Paulo',
      createdAt: now,
      updatedAt: now,
    })
    .run();

  db.insert(tables)
    .values({
      id: tableId,
      tenantId,
      numero: 7,
      capacidade: 4,
      status: 'ocupada',
      sessionStartedAt: now,
    })
    .run();

  db.insert(employees)
    .values({
      id: employeeId,
      tenantId,
      nome: 'Test Cozinheiro',
      pinHash: 'placeholder-bcrypt-hash-for-tests-only',
      roles: ['cozinheiro'],
      isActive: true,
      createdAt: now,
    })
    .run();

  return {
    db,
    repos,
    clock,
    tenantId,
    tableId,
    employeeId,
    cleanup: () => {
      close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
};
