import { CatalogSnapshot, TenantConfig, type TenantId } from '@app/schemas';
import type { Repos } from '../repositories/index.js';
import type { Broadcaster } from '../lib/broadcaster.js';
import { makeEvent } from '../lib/events.js';

type LoggerLike = {
  info: (obj: object, msg?: string) => void;
  warn: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
};

export type CatalogPollerOptions = {
  repos: Repos;
  broadcaster?: Broadcaster;
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

  const bumpBackoff = () => {
    backoff = Math.min(MAX_BACKOFF_MS, Math.max(MIN_BACKOFF_MS, backoff * 2 || MIN_BACKOFF_MS));
  };

  const fetchSnapshot = async (cloudBaseUrl: string, apiKey: string, lastVersion: number | null) => {
    const url = new URL('/api/catalog/snapshot', cloudBaseUrl).toString();
    const res = await fetchImpl(url, { headers: { authorization: `Bearer ${apiKey}` } });
    if (res.status === 401) {
      log?.error({ status: 401, target: 'snapshot' }, '[catalog-poller] cloud rejeitou apiKey');
      return { kind: 'auth-error' as const };
    }
    if (!res.ok) {
      log?.warn({ status: res.status, target: 'snapshot' }, '[catalog-poller] resposta não-ok');
      return { kind: 'http-error' as const };
    }
    const json = await res.json();
    const parsed = CatalogSnapshot.safeParse(json);
    if (!parsed.success) {
      log?.error(
        { target: 'snapshot', issues: parsed.error.issues },
        '[catalog-poller] snapshot inválido',
      );
      return { kind: 'parse-error' as const };
    }
    if (parsed.data.version === lastVersion) return { kind: 'unchanged' as const };
    opts.repos.catalog.replace(parsed.data);
    opts.repos.cloudLink.markSynced(parsed.data.version);
    log?.info(
      {
        version: parsed.data.version,
        categories: parsed.data.categories.length,
        products: parsed.data.products.length,
      },
      '[catalog-poller] snapshot atualizado',
    );
    return { kind: 'ok' as const };
  };

  const fetchTenantConfig = async (cloudBaseUrl: string, apiKey: string) => {
    const url = new URL('/api/tenant/config', cloudBaseUrl).toString();
    const res = await fetchImpl(url, { headers: { authorization: `Bearer ${apiKey}` } });
    if (res.status === 401) {
      log?.error({ status: 401, target: 'config' }, '[catalog-poller] cloud rejeitou apiKey');
      return { kind: 'auth-error' as const };
    }
    if (!res.ok) {
      log?.warn({ status: res.status, target: 'config' }, '[catalog-poller] resposta não-ok');
      return { kind: 'http-error' as const };
    }
    const json = await res.json();
    const parsed = TenantConfig.safeParse(json);
    if (!parsed.success) {
      log?.error(
        { target: 'config', issues: parsed.error.issues },
        '[catalog-poller] config inválida',
      );
      return { kind: 'parse-error' as const };
    }
    const local = opts.repos.tenantConfig.get();
    if (local && local.updatedAt === parsed.data.updatedAt) return { kind: 'unchanged' as const };
    opts.repos.tenantConfig.replace(parsed.data);
    log?.info(
      { tenantId: parsed.data.tenantId, updatedAt: parsed.data.updatedAt },
      '[catalog-poller] tenant config atualizada',
    );
    if (opts.broadcaster) {
      const event = makeEvent(
        'tenant:config-updated',
        parsed.data.tenantId as TenantId,
        { updatedAt: parsed.data.updatedAt },
      );
      opts.broadcaster.broadcast(event);
    }
    return { kind: 'ok' as const };
  };

  const tick = async (): Promise<void> => {
    if (stopped) return;
    const link = opts.repos.cloudLink.get();
    if (!link) return;

    try {
      const [snapshotResult, configResult] = await Promise.all([
        fetchSnapshot(link.cloudBaseUrl, link.apiKey, link.lastSyncVersion ?? null),
        fetchTenantConfig(link.cloudBaseUrl, link.apiKey),
      ]);

      const hadError = [snapshotResult.kind, configResult.kind].some(
        (k) => k === 'auth-error' || k === 'http-error' || k === 'parse-error',
      );
      if (hadError) bumpBackoff();
      else backoff = 0;
    } catch (err) {
      log?.warn(
        { error: err instanceof Error ? err.message : String(err) },
        '[catalog-poller] falha ao puxar (offline?)',
      );
      bumpBackoff();
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
