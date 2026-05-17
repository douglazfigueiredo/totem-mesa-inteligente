'use client';

import { create } from 'zustand';
import type {
  Order,
  OrderId,
  Table,
  TableId,
  WaiterCall,
  WaiterCallId,
  WSEvent,
} from '@app/schemas';

type WaiterState = {
  calls: Map<WaiterCallId, WaiterCall>;
  orders: Map<OrderId, Order>;
  tablesById: Map<TableId, Table>;
  deliveredIds: Set<OrderId>;
  newCallTick: number;
  newOrderReadyTick: number;

  setSnapshot: (input: { calls: WaiterCall[]; orders: Order[]; tables?: Table[] }) => void;
  applyEvent: (event: WSEvent) => void;
  markDelivered: (orderId: OrderId) => void;
  patchCall: (callId: WaiterCallId, patch: Partial<WaiterCall>) => void;
};

export const useWaiterStore = create<WaiterState>((set, get) => ({
  calls: new Map(),
  orders: new Map(),
  tablesById: new Map(),
  deliveredIds: new Set(),
  newCallTick: 0,
  newOrderReadyTick: 0,

  setSnapshot({ calls, orders, tables }) {
    const callsMap = new Map<WaiterCallId, WaiterCall>();
    for (const c of calls) callsMap.set(c.id, c);
    const ordersMap = new Map<OrderId, Order>();
    for (const o of orders) ordersMap.set(o.id, o);
    const tablesMap = new Map<TableId, Table>();
    if (tables) for (const t of tables) tablesMap.set(t.id, t);
    set((cur) => ({
      calls: callsMap,
      orders: ordersMap,
      tablesById: tables ? tablesMap : cur.tablesById,
    }));
  },

  applyEvent(event) {
    const cur = get();

    if (event.type === 'waiter:call') {
      const { callId, createdAt, tableId, reason, obs } = event.payload;
      if (!callId || !createdAt) return;
      const next = new Map(cur.calls);
      next.set(callId, {
        id: callId,
        tenantId: event.tenantId,
        tableId,
        reason,
        obs,
        status: 'pending',
        createdAt,
        escalationLevel: 0,
      });
      set({ calls: next, newCallTick: cur.newCallTick + 1 });
      return;
    }

    if (event.type === 'waiter:ack') {
      const { callId, employeeId } = event.payload;
      const existing = cur.calls.get(callId);
      if (!existing) return;
      const next = new Map(cur.calls);
      next.set(callId, {
        ...existing,
        status: 'acknowledged',
        acknowledgedBy: employeeId,
        acknowledgedAt: event.ts,
      });
      set({ calls: next });
      return;
    }

    if (event.type === 'waiter:resolved') {
      const { callId } = event.payload;
      const existing = cur.calls.get(callId);
      if (!existing) return;
      const next = new Map(cur.calls);
      next.set(callId, {
        ...existing,
        status: 'resolved',
        resolvedAt: event.ts,
      });
      set({ calls: next });
      return;
    }

    if (event.type === 'order:created') {
      const o = event.payload.order;
      const next = new Map(cur.orders);
      next.set(o.id, o);
      // Pedido garçom-only nasce 'pronto' direto — dispara chime do garçom
      // imediatamente (não passa pela cozinha, não tem prep:ready).
      const justBecameReady = o.destino === 'garcom' && o.status === 'pronto';
      set({
        orders: next,
        newOrderReadyTick: justBecameReady
          ? cur.newOrderReadyTick + 1
          : cur.newOrderReadyTick,
      });
      return;
    }

    if (event.type === 'prep:ready') {
      const { orderId } = event.payload;
      const order = cur.orders.get(orderId);
      if (!order) return;
      const next = new Map(cur.orders);
      next.set(orderId, { ...order, status: 'pronto' });
      // dispara chime do garçom — pedido pronto pra entregar
      set({ orders: next, newOrderReadyTick: cur.newOrderReadyTick + 1 });
      return;
    }

    if (event.type === 'order:cancel') {
      const { orderId } = event.payload;
      const order = cur.orders.get(orderId);
      if (!order) return;
      const next = new Map(cur.orders);
      next.set(orderId, { ...order, status: 'cancelado' });
      set({ orders: next });
      return;
    }

    if (event.type === 'order:delivered') {
      const { orderId } = event.payload;
      const order = cur.orders.get(orderId);
      if (!order) return;
      const next = new Map(cur.orders);
      next.set(orderId, { ...order, status: 'entregue' });
      set({ orders: next });
      return;
    }
  },

  markDelivered(orderId) {
    set((s) => {
      const next = new Set(s.deliveredIds);
      next.add(orderId);
      return { deliveredIds: next };
    });
  },

  patchCall(callId, patch) {
    set((s) => {
      const existing = s.calls.get(callId);
      if (!existing) return s;
      const next = new Map(s.calls);
      next.set(callId, { ...existing, ...patch });
      return { calls: next };
    });
  },
}));
