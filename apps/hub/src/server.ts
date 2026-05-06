import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';
import { bootstrap } from './bootstrap.js';
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
  const { tenantId, created } = bootstrap(db, systemClock);

  const app = await buildApp({
    repos,
    tenantId,
    adminSecret: process.env.ADMIN_SECRET,
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  app.addHook('onClose', async () => close());

  await app.listen({ host: HOST, port: PORT });
  app.log.info({ tenantId, dbPath: DATABASE_PATH, bootstrapped: created }, 'hub ready');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
