import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { generateApiKey } from '../src/repositories/device.repo.js';
import { makeMemoryBroadcaster } from '../src/lib/broadcaster.js';
import { setupTestDB, type TestDB } from './setup.js';
import type { DeviceId, DeviceRole, TableId, WSEvent } from '@app/schemas';

export type PairedDevice = {
  id: DeviceId;
  role: DeviceRole;
  apiKey: string;
};

export type TestApp = TestDB & {
  app: FastifyInstance;
  adminSecret: string;
  pairedDevices: Record<'totem' | 'kds' | 'waiter', PairedDevice>;
  broadcastEvents: WSEvent[];
  cleanup: () => Promise<void>;
};

export const setupTestApp = async (): Promise<TestApp> => {
  const ctx = setupTestDB();
  const adminSecret = 'test-admin-secret-must-be-long-enough';
  const broadcaster = makeMemoryBroadcaster();

  const totem = createPaired(ctx, 'totem', 'Totem Mesa 7', ctx.tableId);
  const kds = createPaired(ctx, 'kds', 'KDS Cozinha 1');
  const waiter = createPaired(ctx, 'waiter', 'Garcom Joao');

  const app = await buildApp({
    repos: ctx.repos,
    tenantId: ctx.tenantId,
    broadcaster,
    adminSecret,
    logger: false,
  });
  await app.ready();

  return {
    ...ctx,
    app,
    adminSecret,
    pairedDevices: { totem, kds, waiter },
    broadcastEvents: broadcaster.events,
    cleanup: async () => {
      await app.close();
      ctx.cleanup();
    },
  };
};

const createPaired = (
  ctx: TestDB,
  role: DeviceRole,
  nome: string,
  tableId?: TableId,
): PairedDevice => {
  const apiKey = generateApiKey();
  const device = ctx.repos.devices.create({
    tenantId: ctx.tenantId,
    role,
    nome,
    apiKey,
    tableId,
  });
  return { id: device.id, role: device.role, apiKey };
};
