'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Order, Preparo, Table, WSEvent } from '@app/schemas';
import { HUB_URL } from './hub-client';
import { useAuthStore } from './auth-store';
import { useOrdersStore } from './orders-store';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'offline';

type SocketState = {
  state: ConnectionState;
  lastConnectedAt: number | null;
  driftMs: number | null;
  socket: Socket | null;
  setState: (s: ConnectionState) => void;
  setSocket: (s: Socket | null) => void;
  setDrift: (ms: number) => void;
};

export const useSocketStore = create<SocketState>((set) => ({
  state: 'idle',
  lastConnectedAt: null,
  driftMs: null,
  socket: null,
  setState: (state) =>
    set((cur) => ({
      state,
      lastConnectedAt: state === 'connected' ? Date.now() : cur.lastConnectedAt,
    })),
  setSocket: (socket) => set({ socket }),
  setDrift: (driftMs) => set({ driftMs }),
}));

export const useSocketLifecycle = () => {
  const apiKey = useAuthStore((s) => s.apiKey);

  useEffect(() => {
    if (!apiKey) return;

    const socket = io(HUB_URL, {
      auth: { apiKey },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      timeout: 20000,
    });

    useSocketStore.getState().setSocket(socket);
    useSocketStore.getState().setState('connecting');

    socket.on('connect', () => {
      useSocketStore.getState().setState('connected');
      socket.emit('heartbeat', { clientTime: Date.now() }, (ack: { driftMs: number | null }) => {
        if (ack && typeof ack.driftMs === 'number') {
          useSocketStore.getState().setDrift(ack.driftMs);
        }
      });
      socket.emit('state:sync', {}, (snap: unknown) => {
        if (snap && typeof snap === 'object' && 'activeOrders' in snap) {
          const s = snap as {
            activeOrders: Order[];
            activePreparos: Preparo[];
            tables?: Table[];
          };
          useOrdersStore.getState().setSnapshot({
            orders: s.activeOrders,
            preparos: s.activePreparos,
            tables: s.tables,
          });
        }
      });
    });

    socket.on('disconnect', () => useSocketStore.getState().setState('reconnecting'));
    socket.on('connect_error', () => useSocketStore.getState().setState('offline'));
    socket.io.on('reconnect_attempt', () => useSocketStore.getState().setState('reconnecting'));

    socket.on('event', (raw: unknown) => {
      try {
        useOrdersStore.getState().applyEvent(raw as WSEvent);
      } catch {
        // silent
      }
    });

    const heartbeatTimer = setInterval(() => {
      if (!socket.connected) return;
      socket.emit('heartbeat', { clientTime: Date.now() }, (ack: { driftMs: number | null }) => {
        if (ack && typeof ack.driftMs === 'number') {
          useSocketStore.getState().setDrift(ack.driftMs);
        }
      });
    }, 15000);

    return () => {
      clearInterval(heartbeatTimer);
      socket.removeAllListeners();
      socket.disconnect();
      useSocketStore.getState().setSocket(null);
      useSocketStore.getState().setState('idle');
    };
  }, [apiKey]);
};

export const correctedNow = (driftMs: number | null): number => Date.now() + (driftMs ?? 0);
