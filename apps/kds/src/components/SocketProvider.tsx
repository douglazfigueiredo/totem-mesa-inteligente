'use client';

import { useSocketLifecycle } from '@/lib/socket-client';
import { useOrdersStore } from '@/lib/orders-store';
import { playNewOrderChime, useSoundOnTick } from '@/lib/sound';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketLifecycle();
  const tick = useOrdersStore((s) => s.newOrderTick);
  useSoundOnTick(tick, playNewOrderChime);
  return <>{children}</>;
};
