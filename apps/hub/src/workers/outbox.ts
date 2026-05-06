import type { Repos } from '../repositories/index.js';

type LoggerLike = {
  warn: (obj: object, msg?: string) => void;
};

export type CloudPusher = (entry: {
  eventId: string;
  tenantId: string;
  type: string;
  payload: unknown;
}) => Promise<void>;

export type OutboxWorkerOptions = {
  repos: Repos;
  push: CloudPusher;
  intervalMs?: number;
  batchSize?: number;
  logger?: LoggerLike;
};

export type OutboxHandle = {
  stop: () => Promise<void>;
  tick: () => Promise<void>;
};

export const startOutboxWorker = (opts: OutboxWorkerOptions): OutboxHandle => {
  const intervalMs = opts.intervalMs ?? 2000;
  const batchSize = opts.batchSize ?? 25;
  let stopped = false;
  let inFlight = false;

  const tick = async (): Promise<void> => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const pending = opts.repos.outbox.listPending(batchSize);
      for (const entry of pending) {
        try {
          await opts.push(entry);
          opts.repos.outbox.markSent(entry.eventId);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          opts.repos.outbox.markFailed(entry.eventId, msg);
          opts.logger?.warn({ eventId: entry.eventId, msg }, 'outbox push failed');
        }
      }
    } finally {
      inFlight = false;
    }
  };

  const handle = setInterval(() => {
    void tick();
  }, intervalMs);

  return {
    tick,
    stop: async () => {
      stopped = true;
      clearInterval(handle);
    },
  };
};

export const noopCloudPusher: CloudPusher = async () => {};

export const makeHttpCloudPusher = (cloudBaseUrl: string, tenantId: string): CloudPusher => {
  return async (entry) => {
    const res = await fetch(`${cloudBaseUrl}/api/hub/events`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      throw new Error(`cloud push HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    }
  };
};
