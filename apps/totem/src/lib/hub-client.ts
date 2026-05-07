'use client';

/**
 * Resolve a URL do hub na seguinte ordem:
 * 1. `?hub=...` na query string atual (salva em localStorage)
 * 2. localStorage.hubUrl (de uma visita anterior)
 * 3. NEXT_PUBLIC_HUB_URL (fallback do build, útil em dev)
 *
 * Padrão de uso em prod: cada loja recebe um QR/link
 * `https://totem.totemmesa.app/?hub=http://192.168.1.10:4000` na 1ª
 * configuração. Daí em diante o tablet abre direto.
 */
const resolveHubUrl = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromQuery = params.get('hub');
      if (fromQuery) {
        localStorage.setItem('hubUrl', fromQuery);
        return fromQuery;
      }
      const stored = localStorage.getItem('hubUrl');
      if (stored) return stored;
    } catch {
      // localStorage indisponível (ex: modo privado) — fallback
    }
  }
  return process.env.NEXT_PUBLIC_HUB_URL ?? 'http://localhost:4000';
};

const HUB_URL = resolveHubUrl();

export class HubError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  apiKey?: string;
  eventId?: string;
  ifNoneMatch?: string;
};

export const hubFetch = async <T>(path: string, opts: FetchOpts = {}): Promise<T> => {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.apiKey) headers['x-device-api-key'] = opts.apiKey;
  if (opts.eventId) headers['x-event-id'] = opts.eventId;
  if (opts.ifNoneMatch) headers['if-none-match'] = opts.ifNoneMatch;

  const res = await fetch(`${HUB_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'omit',
    cache: 'no-store',
  });

  if (res.status === 304) {
    return undefined as T;
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new HubError(res.status, json?.code ?? 'unknown', json?.message ?? `HTTP ${res.status}`);
  }
  return json as T;
};

export type PairResponse = {
  device: {
    id: string;
    tenantId: string;
    role: string;
    nome: string;
    tableId: string | null;
    pairedAt: number;
  };
  apiKey: string;
};

export const pairDevice = (input: {
  code: string;
  nome: string;
  tableId?: string;
}): Promise<PairResponse> =>
  hubFetch<PairResponse>('/devices/pair', {
    method: 'POST',
    body: input,
  });

export type PairingTable = { id: string; numero: number; capacidade: number };

export const listTables = (): Promise<{ tables: PairingTable[] }> => hubFetch('/pairing/tables');

export const checkHealth = (): Promise<{ status: string; timestamp: number }> =>
  hubFetch('/health');

export const heartbeat = (apiKey: string, clientTime: number) =>
  hubFetch<{ deviceId: string; serverTime: number; driftMs: number | null }>('/heartbeat', {
    method: 'POST',
    apiKey,
    body: { clientTime },
  });

export { HUB_URL };
