import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { makeCatalogRepo, type CatalogRepo } from './catalog.repo.js';
import { makeDeviceRepo, type DeviceRepo } from './device.repo.js';
import { makeEmployeeRepo, type EmployeeRepo } from './employee.repo.js';
import { makeIdempotencyRepo, type IdempotencyRepo } from './idempotency.repo.js';
import { makeOrderRepo, type OrderRepo } from './order.repo.js';
import { makeOutboxRepo, type OutboxRepo } from './outbox.repo.js';
import { makePairingRepo, type PairingRepo } from './pairing.repo.js';
import { makePreparoRepo, type PreparoRepo } from './preparo.repo.js';
import { makeTableRepo, type TableRepo } from './table.repo.js';
import { makeWaiterRepo, type WaiterRepo } from './waiter.repo.js';

export type Repos = {
  catalog: CatalogRepo;
  devices: DeviceRepo;
  employees: EmployeeRepo;
  idempotency: IdempotencyRepo;
  orders: OrderRepo;
  outbox: OutboxRepo;
  pairing: PairingRepo;
  preparos: PreparoRepo;
  tables: TableRepo;
  waiter: WaiterRepo;
};

export const makeRepos = (db: DBClient, clock: Clock): Repos => ({
  catalog: makeCatalogRepo(db, clock),
  devices: makeDeviceRepo(db, clock),
  employees: makeEmployeeRepo(db, clock),
  idempotency: makeIdempotencyRepo(db, clock),
  orders: makeOrderRepo(db, clock),
  outbox: makeOutboxRepo(db, clock),
  pairing: makePairingRepo(db, clock),
  preparos: makePreparoRepo(db, clock),
  tables: makeTableRepo(db, clock),
  waiter: makeWaiterRepo(db, clock),
});

export type {
  CatalogRepo,
  DeviceRepo,
  EmployeeRepo,
  IdempotencyRepo,
  OrderRepo,
  OutboxRepo,
  PairingRepo,
  PreparoRepo,
  TableRepo,
  WaiterRepo,
};
