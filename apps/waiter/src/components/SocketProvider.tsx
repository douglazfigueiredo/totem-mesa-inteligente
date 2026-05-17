'use client';

import { useSocketLifecycle } from '@/lib/socket-client';
import { playOrderReadyChime, playWaiterCallChime, useSoundOnTick } from '@/lib/sound';
import { useWaiterStore } from '@/lib/waiter-store';

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketLifecycle();
  const callTick = useWaiterStore((s) => s.newCallTick);
  const readyTick = useWaiterStore((s) => s.newOrderReadyTick);
  useSoundOnTick(callTick, playWaiterCallChime);
  useSoundOnTick(readyTick, playOrderReadyChime);
  return <>{children}</>;
};
