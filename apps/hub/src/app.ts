import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyStatic from '@fastify/static';
import type { Repos } from './repositories/index.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import devicesRoutes from './routes/devices.js';
import ordersRoutes from './routes/orders.js';
import prepRoutes from './routes/prep.js';
import waiterRoutes from './routes/waiter.js';
import stateRoutes from './routes/state.js';
import heartbeatRoutes from './routes/heartbeat.js';
import catalogRoutes from './routes/catalog.js';
import cloudRoutes from './routes/cloud.js';
import authRoutes from './routes/auth.js';
import type { Broadcaster } from './lib/broadcaster.js';
import { makeEvent } from './lib/events.js';
import type { TenantId, WSEvent, WSEventType } from '@app/schemas';

declare module 'fastify' {
  interface FastifyInstance {
    repos: Repos;
    tenantId: TenantId;
    broadcaster: Broadcaster;
    publishAndEnqueue: <T extends WSEventType>(
      type: T,
      tenantId: TenantId,
      payload: Extract<WSEvent, { type: T }>['payload'],
    ) => WSEvent;
  }
}

export type BuildAppOptions = {
  repos: Repos;
  tenantId: TenantId;
  broadcaster: Broadcaster;
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
  // tenantId é dinâmico: cloud quando pareado, senão o local do bootstrap.
  // Decorate fixo capturaria opts.tenantId (= local) e ignoraria pareamentos
  // posteriores, fazendo pairing-codes/devices ficarem com tenant errado.
  Object.defineProperty(app, 'tenantId', {
    get: (): TenantId =>
      (opts.repos.cloudLink.get()?.tenantId as TenantId | undefined) ?? opts.tenantId,
    enumerable: true,
    configurable: true,
  });
  app.decorate('broadcaster', opts.broadcaster);
  app.decorate('publishAndEnqueue', function publishAndEnqueue(type, tenantId, payload) {
    const event = makeEvent(type, tenantId, payload);
    app.broadcaster.broadcast(event);
    opts.repos.outbox.enqueue({
      eventId: event.eventId,
      tenantId,
      type,
      payload,
    });
    return event;
  });

  await app.register(errorHandlerPlugin);
  await app.register(helmet);

  // CORS: lista de origens permitidas via ALLOWED_ORIGINS (CSV).
  // Em dev (NODE_ENV !== 'production') ou se não setado, aceita tudo.
  // Em prod, sem a env, aceita só requests same-origin (sem header Origin).
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const isDev = process.env.NODE_ENV !== 'production';
  await app.register(cors, {
    origin:
      isDev || allowedOrigins.length === 0
        ? true
        : (origin, cb) => {
            if (!origin) return cb(null, true); // same-origin
            cb(null, allowedOrigins.includes(origin));
          },
  });
  await app.register(authPlugin, { adminSecret: opts.adminSecret });

  // Admin UI estático — HTML/CSS/JS vanilla servidos do `public/`.
  // Prefix `/admin-ui/` evita colisão com endpoints `/admin/*`
  // (pairing-codes, cloud/pair, etc) já registrados.
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const publicRoot = join(__dirname, '..', 'public');
  await app.register(fastifyStatic, {
    root: publicRoot,
    prefix: '/admin-ui/',
    decorateReply: false,
  });
  app.get('/admin', async (_req, reply) => {
    return reply.redirect('/admin-ui/admin/', 302);
  });

  app.get('/health', async () => {
    const link = opts.repos.cloudLink.get();
    return {
      status: 'ok',
      service: 'hub',
      version: process.env.APP_VERSION ?? 'dev',
      timestamp: Date.now(),
      uptimeSec: Math.round(process.uptime()),
      db: { ordersCount: opts.repos.orders.count() },
      outbox: { pending: opts.repos.outbox.pendingCount() },
      cloud: link
        ? {
            paired: true,
            tenantId: link.tenantId,
            tenantNome: link.tenantNome,
            cloudBaseUrl: link.cloudBaseUrl,
            lastSyncAt: link.lastSyncAt,
            lastSyncVersion: link.lastSyncVersion,
          }
        : { paired: false },
    };
  });

  await app.register(devicesRoutes);
  await app.register(ordersRoutes);
  await app.register(prepRoutes);
  await app.register(waiterRoutes);
  await app.register(stateRoutes);
  await app.register(heartbeatRoutes);
  await app.register(catalogRoutes);
  await app.register(cloudRoutes);
  await app.register(authRoutes);

  return app;
};
