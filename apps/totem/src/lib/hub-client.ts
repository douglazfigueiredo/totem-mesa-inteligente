'use client';

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL ?? 'http://localhost:4000';

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
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (opts.apiKey) headers['x-device-api-key'] = opts.apiKey;
  if (opts.eventId) headers['x-event-id'] = opts.eventId;
  if (opts.ifNoneMatch) headers['if-none-match'] = opts.ifNoneMatch;

  const res = await fetch(`${HUB_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
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
