import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildApp } from './app.js';
import { bootstrap } from './bootstrap.js';
import { createDB } from './db/index.js';
import { systemClock } from './lib/clock.js';
import { makeRepos } from './repositories/index.js';
import { makeMemoryBroadcaster, makeSocketBroadcaster } from './lib/broadcaster.js';
import { createSocketServer } from './sockets/server.js';
import { startTimerWorker } from './workers/timer.js';
import { startCatalogPoller } from './workers/catalog-poller.js';
import { makeHttpCloudPusher, noopCloudPusher, startOutboxWorker } from './workers/outbox.js';

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 4000);
const DATABASE_PATH = process.env.DATABASE_PATH ?? './data/hub.db';
const CLOUD_BASE_URL = process.env.CLOUD_BASE_URL;

async function main() {
  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  const { db, close } = createDB({
    path: DATABASE_PATH,
    applyMigrations: true,
    migrationsFolder: new URL('./db/migrations', import.meta.url).pathname,
  });

  const repos = makeRepos(db, systemClock);
  const { tenantId, created } = bootstrap(db, systemClock);

  const tempBroadcaster = makeMemoryBroadcaster();

  const app = await buildApp({
    repos,
    tenantId,
    broadcaster: tempBroadcaster,
    adminSecret: process.env.ADMIN_SECRET,
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  let timerWorkerStop: (() => Promise<void>) | null = null;
  let outboxWorkerStop: (() => Promise<void>) | null = null;
  let pollerStop: (() => Promise<void>) | null = null;
  let realBroadcasterClose: (() => Promise<void>) | null = null;

  app.addHook('onClose', async () => {
    if (pollerStop) await pollerStop();
    if (timerWorkerStop) await timerWorkerStop();
    if (outboxWorkerStop) await outboxWorkerStop();
    if (realBroadcasterClose) await realBroadcasterClose();
    close();
  });

  await app.listen({ host: HOST, port: PORT });

  const io = createSocketServer({
    httpServer: app.server,
    repos,
    logger: app.log,
  });
  const realBroadcaster = makeSocketBroadcaster(io);
  app.broadcaster = realBroadcaster;
  realBroadcasterClose = realBroadcaster.close;
  for (const ev of tempBroadcaster.events) {
    realBroadcaster.broadcast(ev);
  }

  const timerWorker = startTimerWorker({
    repos,
    broadcaster: realBroadcaster,
    intervalMs: 1000,
    logger: app.log,
  });
  timerWorkerStop = timerWorker.stop;

  const cloudPusher = CLOUD_BASE_URL
    ? makeHttpCloudPusher(CLOUD_BASE_URL, tenantId)
    : noopCloudPusher;
  const outboxWorker = startOutboxWorker({
    repos,
    push: cloudPusher,
    intervalMs: 2000,
    logger: app.log,
  });
  outboxWorkerStop = outboxWorker.stop;

  const poller = startCatalogPoller({
    repos,
    intervalMs: Number(process.env.CATALOG_POLL_INTERVAL_MS ?? 60_000),
    logger: app.log,
  });
  pollerStop = poller.stop;

  app.log.info(
    {
      tenantId,
      dbPath: DATABASE_PATH,
      bootstrapped: created,
      cloudPush: CLOUD_BASE_URL ?? 'noop',
    },
    'hub ready',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
