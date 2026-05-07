'use client';

import { useEffect } from 'react';
import { useSocketStore, useSocketLifecycle } from '@/lib/socket-client';
import { useTenantConfigLoader } from '@/lib/tenant-config-store';
import { drain, useOutboxStore } from '@/lib/outbox';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketLifecycle();
  useTenantConfigLoader();

  const state = useSocketStore((s) => s.state);

  useEffect(() => {
    useOutboxStore.getState().refresh();
  }, []);

  useEffect(() => {
    if (state !== 'connected') return;
    void drain();
  }, [state]);

  return <>{children}</>;
};
