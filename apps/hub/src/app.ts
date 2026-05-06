import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { Repos } from './repositories/index.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import devicesRoutes from './routes/devices.js';
import ordersRoutes from './routes/orders.js';
import prepRoutes from './routes/prep.js';
import waiterRoutes from './routes/waiter.js';
import stateRoutes from './routes/state.js';
import heartbeatRoutes from './routes/heartbeat.js';
import type { TenantId } from '@app/schemas';

declare module 'fastify' {
  interface FastifyInstance {
    repos: Repos;
    tenantId: TenantId;
  }
}

export type BuildAppOptions = {
  repos: Repos;
  tenantId: TenantId;
  adminSecret?: string;
  logger?: boolean | object;
};

export const buildApp = async (opts: BuildAppOptions): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: opts.logger ?? false,
    genReqId: () => crypto.randomUUID(),
    disableRequestLogging: false,
  });

  app.decorate('repos', opts.repos);
  app.decorate('tenantId', opts.tenantId);

  await app.register(errorHandlerPlugin);
  await app.register(helmet);
  await app.register(cors, { origin: true });
  await app.register(authPlugin, { adminSecret: opts.adminSecret });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'hub',
    version: process.env.APP_VERSION ?? 'dev',
    timestamp: Date.now(),
    db: { ordersCount: opts.repos.orders.count() },
    outbox: { pending: opts.repos.outbox.pendingCount() },
  }));

  await app.register(devicesRoutes);
  await app.register(ordersRoutes);
  await app.register(prepRoutes);
  await app.register(waiterRoutes);
  await app.register(stateRoutes);
  await app.register(heartbeatRoutes);

  return app;
};
