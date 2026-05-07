import { CatalogSnapshot } from '@app/schemas';
import type { Repos } from '../repositories/index.js';

type LoggerLike = {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
};

export type CatalogPollerOptions = {
  repos: Repos;
  intervalMs?: number;
  logger?: LoggerLike;
  fetchImpl?: typeof fetch;
};

export type PollerHandle = {
  stop: () => Promise<void>;
  tick: () => Promise<void>;
};

const DEFAULT_INTERVAL_MS = 60_000;
const MIN_BACKOFF_MS = 5_000;
const MAX_BACKOFF_MS = 5 * 60_000;

export const startCatalogPoller = (opts: CatalogPollerOptions): PollerHandle => {
  const intervalMs = opts.intervalMs ?? DEFAULT_INTERVAL_MS;
  const log = opts.logger;
  const fetchImpl = opts.fetchImpl ?? fetch;
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;
  let backoff = 0;

  const tick = async (): Promise<void> => {
    if (stopped) return;
    const link = opts.repos.cloudLink.get();
    if (!link) {
      // sem pareamento — apenas espera o próximo ciclo, sem warn (caso normal)
      return;
    }

    const url = new URL('/api/catalog/snapshot', link.cloudBaseUrl).toString();
    try {
      const res = await fetchImpl(url, {
        headers: { authorization: `Bearer ${link.apiKey}` },
      });
      if (res.status === 401) {
        log?.error({ status: 401 }, '[catalog-poller] cloud rejeitou apiKey — desparear?');
        backoff = Math.min(MAX_BACKOFF_MS, Math.max(MIN_BACKOFF_MS, backoff * 2 || MIN_BACKOFF_MS));
        return;
      }
      if (!res.ok) {
        log?.warn({ status: res.status }, '[catalog-poller] resposta não-ok');
        backoff = Math.min(MAX_BACKOFF_MS, Math.max(MIN_BACKOFF_MS, backoff * 2 || MIN_BACKOFF_MS));
        return;
      }
      const json = await res.json();
      const parsed = CatalogSnapshot.safeParse(json);
      if (!parsed.success) {
        log?.error(
          { issues: parsed.error.issues },
          '[catalog-poller] snapshot inválido (cloud↔hub schema drift?)',
        );
        backoff = Math.min(MAX_BACKOFF_MS, Math.max(MIN_BACKOFF_MS, backoff * 2 || MIN_BACKOFF_MS));
        return;
      }

      const snapshot = parsed.data;
      if (link.lastSyncVersion === snapshot.version) {
        backoff = 0;
        return;
      }
      opts.repos.catalog.replace(snapshot);
      opts.repos.cloudLink.markSynced(snapshot.version);
      backoff = 0;
      log?.info(
        {
          version: snapshot.version,
          categories: snapshot.categories.length,
          products: snapshot.products.length,
        },
        '[catalog-poller] snapshot atualizado',
      );
    } catch (err) {
      log?.warn(
        { error: err instanceof Error ? err.message : String(err) },
        '[catalog-poller] falha ao puxar (offline?)',
      );
      backoff = Math.min(MAX_BACKOFF_MS, Math.max(MIN_BACKOFF_MS, backoff * 2 || MIN_BACKOFF_MS));
    }
  };

  const schedule = () => {
    if (stopped) return;
    const delay = backoff > 0 ? backoff : intervalMs;
    timer = setTimeout(async () => {
      await tick();
      schedule();
    }, delay);
  };

  schedule();

  return {
    tick,
    async stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
};
