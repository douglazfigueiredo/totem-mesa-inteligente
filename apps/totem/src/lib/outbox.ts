'use client';

/**
 * Outbox local pro totem — guarda requests pendentes em IndexedDB
 * quando hub está fora, drena automaticamente quando reconecta.
 *
 * Por que IndexedDB e não localStorage:
 * - 5MB+ de espaço (vs 5MB total compartilhado)
 * - acesso async não-bloqueante
 * - sobrevive a reload de página
 *
 * Idempotência via `eventId` no header — hub já dedupa.
 */

import { create } from 'zustand';
import { hubFetch, HubError } from './hub-client';

const DB_NAME = 'totem-outbox';
const DB_VERSION = 1;
const STORE = 'requests';

export type OutboxItem = {
  id: string;
  type: 'order' | 'waiter-call';
  path: string;
  method: 'POST';
  body: unknown;
  apiKey: string;
  eventId: string;
  retries: number;
  lastError?: string;
  createdAt: number;
};

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB indisponível'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('open failed'));
  });

const tx = async <T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const store = t.objectStore(STORE);
    let result: T | undefined;
    Promise.resolve(fn(store)).then((r) => (result = r));
    t.oncomplete = () => resolve(result as T);
    t.onerror = () => reject(t.error ?? new Error('tx failed'));
    t.onabort = () => reject(t.error ?? new Error('tx aborted'));
  });
};

export const enqueue = async (item: Omit<OutboxItem, 'retries' | 'createdAt'>): Promise<void> => {
  const full: OutboxItem = { ...item, retries: 0, createdAt: Date.now() };
  await tx('readwrite', (s) => {
    s.put(full);
  });
  useOutboxStore.getState().refresh();
};

export const list = async (): Promise<OutboxItem[]> =>
  tx('readonly', (s) => {
    return new Promise<OutboxItem[]>((resolve, reject) => {
      const req = s.getAll();
      req.onsuccess = () => {
        const arr = (req.result as OutboxItem[]) ?? [];
        arr.sort((a, b) => a.createdAt - b.createdAt);
        resolve(arr);
      };
      req.onerror = () => reject(req.error);
    });
  });

const remove = async (id: string): Promise<void> => {
  await tx('readwrite', (s) => {
    s.delete(id);
  });
};

const update = async (item: OutboxItem): Promise<void> => {
  await tx('readwrite', (s) => {
    s.put(item);
  });
};

type OutboxState = {
  pending: number;
  draining: boolean;
  refresh: () => void;
  setDraining: (v: boolean) => void;
};

export const useOutboxStore = create<OutboxState>((set) => ({
  pending: 0,
  draining: false,
  refresh: () => {
    void list().then((items) => set({ pending: items.length }));
  },
  setDraining: (draining) => set({ draining }),
}));

export const drain = async (): Promise<{ sent: number; failed: number }> => {
  if (useOutboxStore.getState().draining) return { sent: 0, failed: 0 };
  useOutboxStore.getState().setDraining(true);
  let sent = 0;
  let failed = 0;
  try {
    const items = await list();
    for (const item of items) {
      try {
        await hubFetch(item.path, {
          method: item.method,
          apiKey: item.apiKey,
          eventId: item.eventId,
          body: item.body,
        });
        await remove(item.id);
        sent++;
      } catch (err) {
        if (err instanceof HubError && err.status >= 400 && err.status < 500) {
          // erro de cliente — remover pra não retentar pra sempre
          await remove(item.id);
          failed++;
        } else {
          await update({
            ...item,
            retries: item.retries + 1,
            lastError: err instanceof Error ? err.message : String(err),
          });
          failed++;
          break; // network error — pausar até próximo trigger
        }
      }
    }
  } finally {
    useOutboxStore.getState().setDraining(false);
    useOutboxStore.getState().refresh();
  }
  return { sent, failed };
};
