'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import type { TenantConfig } from '@app/schemas';
import { hubFetch, HubError } from './hub-client';
import { useAuthStore } from './auth-store';

type State = {
  config: TenantConfig | null;
  hydratedAt: number | null;
  load: (apiKey: string) => Promise<void>;
};

const useStore = create<State>((set, get) => ({
  config: null,
  hydratedAt: null,
  load: async (apiKey: string) => {
    if (!apiKey) return;
    try {
      const cfg = await hubFetch<TenantConfig | undefined>('/tenant/config', { apiKey });
      if (cfg) set({ config: cfg, hydratedAt: Date.now() });
      else if (!get().config) set({ hydratedAt: Date.now() });
    } catch (err) {
      if (err instanceof HubError && err.status === 204) return;
      // silenciado — fallback nas envs
      if (!get().hydratedAt) set({ hydratedAt: Date.now() });
    }
  },
}));

const ENV = {
  brand: process.env.NEXT_PUBLIC_TENANT_BRAND ?? 'Pizzaria Dev',
  area: process.env.NEXT_PUBLIC_TENANT_AREA ?? 'salão principal',
  sinceLabel: process.env.NEXT_PUBLIC_TENANT_SINCE ?? 'desde 2026',
  heroImageUrl: process.env.NEXT_PUBLIC_TENANT_HERO_IMG ?? '',
  wifiSsid: process.env.NEXT_PUBLIC_WIFI_SSID ?? 'pizzaria-livre',
  wifiPass: process.env.NEXT_PUBLIC_WIFI_PASS ?? 'margherita',
};

export type ResolvedTenantConfig = {
  brand: string;
  area: string;
  sinceLabel: string;
  heroImageUrl: string;
  wifiSsid: string;
  wifiPass: string;
};

/**
 * Lê config do hub se disponível, com fallback nas envs `NEXT_PUBLIC_*`.
 * Sempre retorna strings prontas pra renderizar (sem null).
 */
export function useTenantConfig(): ResolvedTenantConfig {
  const config = useStore((s) => s.config);
  return {
    brand: config?.brand?.trim() || config?.nome?.trim() || ENV.brand,
    area: config?.area?.trim() || ENV.area,
    sinceLabel: config?.sinceLabel?.trim() || ENV.sinceLabel,
    heroImageUrl: config?.heroImageUrl?.trim() || ENV.heroImageUrl,
    wifiSsid: config?.wifiSsid?.trim() || ENV.wifiSsid,
    wifiPass: config?.wifiPass?.trim() || ENV.wifiPass,
  };
}

/**
 * Hydra a store após pareamento e revalida em foco/visibilidade.
 * Monta uma vez no SocketProvider/layout.
 */
export function useTenantConfigLoader() {
  const apiKey = useAuthStore((s) => s.apiKey);
  const load = useStore((s) => s.load);

  useEffect(() => {
    if (!apiKey) return;
    load(apiKey);

    const onVisible = () => {
      if (document.visibilityState === 'visible') load(apiKey);
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(() => load(apiKey), 5 * 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [apiKey, load]);
}
