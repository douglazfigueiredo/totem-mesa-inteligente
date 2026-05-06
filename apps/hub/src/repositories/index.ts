import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { makeDeviceRepo, type DeviceRepo } from './device.repo.js';
import { makeIdempotencyRepo, type IdempotencyRepo } from './idempotency.repo.js';
import { makeOrderRepo, type OrderRepo } from './order.repo.js';
import { makeOutboxRepo, type OutboxRepo } from './outbox.repo.js';
import { makePairingRepo, type PairingRepo } from './pairing.repo.js';
import { makePreparoRepo, type PreparoRepo } from './preparo.repo.js';

export type Repos = {
  devices: DeviceRepo;
  idempotency: IdempotencyRepo;
  orders: OrderRepo;
  outbox: OutboxRepo;
  pairing: PairingRepo;
  preparos: PreparoRepo;
};

export const makeRepos = (db: DBClient, clock: Clock): Repos => ({
  devices: makeDeviceRepo(db, clock),
  idempotency: makeIdempotencyRepo(db, clock),
  orders: makeOrderRepo(db, clock),
  outbox: makeOutboxRepo(db, clock),
  pairing: makePairingRepo(db, clock),
  preparos: makePreparoRepo(db, clock),
});

export type { DeviceRepo, IdempotencyRepo, OrderRepo, OutboxRepo, PairingRepo, PreparoRepo };
