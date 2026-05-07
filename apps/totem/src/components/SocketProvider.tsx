'use client';

import { useSocketLifecycle } from '@/lib/socket-client';
import { useTenantConfigLoader } from '@/lib/tenant-config-store';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketLifecycle();
  useTenantConfigLoader();
  return <>{children}</>;
};
