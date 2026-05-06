'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import type { CatalogSnapshot } from '@app/schemas';
import { hubFetch, HubError } from './hub-client';
import { useAuthStore } from './auth-store';

type CatalogState = {
  snapshot: CatalogSnapshot | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number | null;
  fetch: (apiKey: string) => Promise<void>;
};

export const useCatalogStore = create<CatalogState>((set, get) => ({
  snapshot: null,
  loading: false,
  error: null,
  fetchedAt: null,
  async fetch(apiKey) {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const ifNoneMatch = get().snapshot ? `"v${get().snapshot!.version}"` : undefined;
      const result = await hubFetch<CatalogSnapshot | undefined>('/catalog', {
        apiKey,
        ifNoneMatch,
      });
      if (result) {
        set({ snapshot: result, fetchedAt: Date.now(), loading: false });
      } else {
        set({ fetchedAt: Date.now(), loading: false });
      }
    } catch (err) {
      const msg = err instanceof HubError ? `${err.code}: ${err.message}` : String(err);
      set({ error: msg, loading: false });
    }
  },
}));

export const useCatalog = () => {
  const apiKey = useAuthStore((s) => s.apiKey);
  const snapshot = useCatalogStore((s) => s.snapshot);
  const loading = useCatalogStore((s) => s.loading);
  const error = useCatalogStore((s) => s.error);
  const fetchCatalog = useCatalogStore((s) => s.fetch);

  useEffect(() => {
    if (!apiKey) return;
    void fetchCatalog(apiKey);
  }, [apiKey, fetchCatalog]);

  return { snapshot, loading, error };
};
