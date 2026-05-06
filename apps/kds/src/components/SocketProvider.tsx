'use client';

import { useSocketLifecycle } from '@/lib/socket-client';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketLifecycle();
  return <>{children}</>;
};
