import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

import { mkdirSync, readFileSync, existsSync } from 'node:fs';
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
import { makeCloudLinkPusher, startOutboxWorker } from './workers/outbox.js';
import { startBackupWorker } from './workers/backup.js';

const HOST = process.env.HOST ?? '0.0.0.0';
const PORT = Number(process.env.PORT ?? 4000);
const DATABASE_PATH = process.env.DATABASE_PATH ?? './data/hub.db';
const HTTPS_CERT_PATH = process.env.HTTPS_CERT_PATH;
const HTTPS_KEY_PATH = process.env.HTTPS_KEY_PATH;

const loadHttps = () => {
  if (!HTTPS_CERT_PATH || !HTTPS_KEY_PATH) return undefined;
  if (!existsSync(HTTPS_CERT_PATH) || !existsSync(HTTPS_KEY_PATH)) {
    console.warn(
      `[hub] HTTPS_CERT_PATH/HTTPS_KEY_PATH apontam pra arquivos inexistentes (${HTTPS_CERT_PATH}, ${HTTPS_KEY_PATH}). Fallback HTTP.`,
    );
    return undefined;
  }
  return {
    cert: readFileSync(HTTPS_CERT_PATH),
    key: readFileSync(HTTPS_KEY_PATH),
  };
};

async function main() {
  mkdirSync(dirname(DATABASE_PATH), { recursive: true });

  const { db, close, backup } = createDB({
    path: DATABASE_PATH,
    applyMigrations: true,
    migrationsFolder: new URL('./db/migrations', import.meta.url).pathname,
  });

  const repos = makeRepos(db, systemClock);
  const { tenantId, created } = bootstrap(db, systemClock);

  // Auto-cura hubs pareados antes do mirror tenant existir: garante que
  // o tenant do cloud está na tabela local pra sync de catálogo/mesas/employees
  // não falhar com FK violation.
  repos.cloudLink.ensureTenantMirror();

  const tempBroadcaster = makeMemoryBroadcaster();

  const httpsOptions = loadHttps();
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
    https: httpsOptions,
  });

  let timerWorkerStop: (() => Promise<void>) | null = null;
  let outboxWorkerStop: (() => Promise<void>) | null = null;
  let pollerStop: (() => Promise<void>) | null = null;
  let backupWorkerStop: (() => Promise<void>) | null = null;
  let realBroadcasterClose: (() => Promise<void>) | null = null;

  app.addHook('onClose', async () => {
    if (pollerStop) await pollerStop();
    if (timerWorkerStop) await timerWorkerStop();
    if (outboxWorkerStop) await outboxWorkerStop();
    if (backupWorkerStop) await backupWorkerStop();
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

  const cloudPusher = makeCloudLinkPusher(repos);
  const outboxWorker = startOutboxWorker({
    repos,
    push: cloudPusher,
    intervalMs: 2000,
    logger: app.log,
    shouldRun: () => repos.cloudLink.get() !== null,
  });
  outboxWorkerStop = outboxWorker.stop;

  const poller = startCatalogPoller({
    repos,
    broadcaster: realBroadcaster,
    intervalMs: Number(process.env.CATALOG_POLL_INTERVAL_MS ?? 60_000),
    logger: app.log,
  });
  pollerStop = poller.stop;

  const backupHours = Number(process.env.BACKUP_INTERVAL_HOURS ?? 24);
  const backupKeep = Number(process.env.BACKUP_KEEP ?? 7);
  if (backupHours > 0) {
    const backupWorker = startBackupWorker({
      dbPath: DATABASE_PATH,
      backup,
      intervalMs: backupHours * 60 * 60 * 1000,
      keep: backupKeep,
      logger: app.log,
    });
    backupWorkerStop = backupWorker.stop;
  }

  const cloudLinkAtBoot = repos.cloudLink.get();
  app.log.info(
    {
      tenantId,
      dbPath: DATABASE_PATH,
      bootstrapped: created,
      cloudPush: cloudLinkAtBoot ? cloudLinkAtBoot.cloudBaseUrl : 'unpaired',
      protocol: httpsOptions ? 'https' : 'http',
    },
    'hub ready',
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
