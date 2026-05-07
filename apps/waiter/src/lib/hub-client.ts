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
};

export const hubFetch = async <T>(path: string, opts: FetchOpts = {}): Promise<T> => {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers['content-type'] = 'application/json';
  if (opts.apiKey) headers['x-device-api-key'] = opts.apiKey;
  if (opts.eventId) headers['x-event-id'] = opts.eventId;

  const res = await fetch(`${HUB_URL}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'omit',
    cache: 'no-store',
  });

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

export const pairDevice = (input: { code: string; nome: string }): Promise<PairResponse> =>
  hubFetch<PairResponse>('/devices/pair', { method: 'POST', body: input });

export type PinLoginResponse = {
  employee: { id: string; nome: string; roles: string[] };
};

export const loginPin = (apiKey: string, pin: string): Promise<PinLoginResponse> =>
  hubFetch<PinLoginResponse>('/auth/pin', {
    method: 'POST',
    apiKey,
    body: { pin },
  });

export const ackWaiterCall = (apiKey: string, callId: string, employeeId: string) =>
  hubFetch(`/waiter/calls/${callId}/ack`, {
    method: 'POST',
    apiKey,
    body: { employeeId },
  });

export const resolveWaiterCall = (apiKey: string, callId: string, employeeId: string) =>
  hubFetch(`/waiter/calls/${callId}/resolve`, {
    method: 'POST',
    apiKey,
    body: { employeeId },
  });

export const deliverOrder = (apiKey: string, orderId: string, employeeId: string) =>
  hubFetch(`/orders/${orderId}/deliver`, {
    method: 'POST',
    apiKey,
    body: { employeeId },
  });

export { HUB_URL };
