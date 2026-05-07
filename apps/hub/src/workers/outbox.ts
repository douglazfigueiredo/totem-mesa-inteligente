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
  /**
   * Predicado opcional checado antes de cada tick. Quando retorna false,
   * o worker pula a iteração inteira (não chama push, não markFailed).
   * Usado pra pausar o outbox quando o hub não está pareado com cloud.
   */
  shouldRun?: () => boolean;
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
    if (opts.shouldRun && !opts.shouldRun()) return;
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

/**
 * Pusher que lê `cloud_link` a cada chamada — autoaplica novas credenciais
 * após pair/unpair sem precisar reiniciar o hub. Usar com `shouldRun` no
 * worker pra evitar tentar quando não há link.
 *
 * IMPORTANTE: o `tenantId` no payload é reescrito pra `link.tenantId` (o
 * tenantId do hub no CLOUD), não o tenantId local. O hub local tem seu
 * próprio UUID gerado no bootstrap, que não bate com o tenantId do cloud
 * — então o cloud rejeitaria com 403 "tenant mismatch" se a gente
 * mandasse o local.
 */
export const makeCloudLinkPusher = (repos: Repos): CloudPusher => {
  return async (entry) => {
    const link = repos.cloudLink.get();
    if (!link) throw new Error('NO_CLOUD_LINK');

    const url = new URL('/api/hub/events', link.cloudBaseUrl).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${link.apiKey}`,
      },
      body: JSON.stringify({
        eventId: entry.eventId,
        tenantId: link.tenantId,
        type: entry.type,
        payload: entry.payload,
        ts: Date.now(),
      }),
    });
    if (!res.ok) {
      throw new Error(`cloud push HTTP ${res.status}: ${await res.text().catch(() => '')}`);
    }
  };
};

/**
 * @deprecated Usar `makeCloudLinkPusher` que lê credenciais do cloud_link
 * (pareamento dinâmico). Mantido temporariamente pra retrocompat.
 */
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
