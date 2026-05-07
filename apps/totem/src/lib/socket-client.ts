'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Order, Preparo, WSEvent } from '@app/schemas';
import { HUB_URL } from './hub-client';
import { useAuthStore } from './auth-store';
import { useOrdersStore } from './orders-store';
import { useTenantConfigStore } from './tenant-config-store';

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
  const tableId = useAuthStore((s) => s.tableId);

  useEffect(() => {
    if (!apiKey || !tableId) return;

    const socket = io(HUB_URL, {
      auth: { apiKey },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.3,
      timeout: 20000,
    });

    const store = useSocketStore.getState();
    store.setSocket(socket);
    store.setState('connecting');

    socket.on('connect', () => {
      useSocketStore.getState().setState('connected');
      socket.emit(
        'heartbeat',
        { clientTime: Date.now() },
        (ack: { serverTime: number; driftMs: number | null }) => {
          if (ack && typeof ack.driftMs === 'number') {
            useSocketStore.getState().setDrift(ack.driftMs);
          }
        },
      );
      socket.emit('state:sync', { tableId }, (snap: unknown) => {
        if (snap && typeof snap === 'object' && 'activeOrders' in snap) {
          const s = snap as {
            activeOrders: Order[];
            activePreparos: Preparo[];
          };
          useOrdersStore.getState().setSnapshot(s.activeOrders, s.activePreparos);
        }
      });
    });

    socket.on('disconnect', () => {
      useSocketStore.getState().setState('reconnecting');
    });

    socket.on('connect_error', () => {
      useSocketStore.getState().setState('offline');
    });

    socket.io.on('reconnect_attempt', () => {
      useSocketStore.getState().setState('reconnecting');
    });

    socket.on('event', (raw: unknown) => {
      try {
        const ev = raw as WSEvent;
        if (ev.type === 'tenant:config-updated') {
          useTenantConfigStore.getState().load(apiKey);
          return;
        }
        useOrdersStore.getState().applyEvent(ev);
      } catch {
        // silent — invalid event
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
  }, [apiKey, tableId]);
};

export const correctedNow = (driftMs: number | null): number => Date.now() + (driftMs ?? 0);
