'use client';

import { useSocketLifecycle } from '@/lib/socket-client';
import { playWaiterCallChime, useSoundOnTick } from '@/lib/sound';
import { useWaiterStore } from '@/lib/waiter-store';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketLifecycle();
  const tick = useWaiterStore((s) => s.newCallTick);
  useSoundOnTick(tick, playWaiterCallChime);
  return <>{children}</>;
};
