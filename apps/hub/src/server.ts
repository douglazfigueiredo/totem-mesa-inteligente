import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { createDB } from './db/index.js';
import { systemClock } from './lib/clock.js';
import { makeRepos } from './repositories/index.js';

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 4000);
const DATABASE_PATH = process.env.DATABASE_PATH ?? './data/hub.db';

async function main() {
  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  const { db, close } = createDB({
    path: DATABASE_PATH,
    applyMigrations: true,
    migrationsFolder: new URL('./db/migrations', import.meta.url).pathname,
  });

  const repos = makeRepos(db, systemClock);

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  app.decorate('repos', repos);

  await app.register(helmet);
  await app.register(cors, { origin: true });

  app.get('/health', async () => ({
    status: 'ok',
    service: 'hub',
    version: process.env.APP_VERSION ?? 'dev',
    timestamp: Date.now(),
    db: { path: DATABASE_PATH, ordersCount: repos.orders.count() },
    outbox: { pending: repos.outbox.pendingCount() },
  }));

  app.addHook('onClose', async () => {
    close();
  });

  await app.listen({ host: HOST, port: PORT });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

declare module 'fastify' {
  interface FastifyInstance {
    repos: ReturnType<typeof makeRepos>;
  }
}
