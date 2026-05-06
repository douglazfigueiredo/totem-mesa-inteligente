'use client';

import { create } from 'zustand';
import type { Order, OrderId, Preparo, PreparoId, ProductId, WSEvent } from '@app/schemas';

export type UnavailableNotice = {
  productId: ProductId;
  suggestedSubstitutes: ProductId[];
  receivedAt: number;
};

type OrdersState = {
  orders: Map<OrderId, Order>;
  preparos: Map<PreparoId, Preparo>;
  preparoByOrder: Map<OrderId, PreparoId>;
  readyAlerts: OrderId[];
  unavailableQueue: UnavailableNotice[];

  setSnapshot: (orders: Order[], preparos: Preparo[]) => void;
  applyEvent: (event: WSEvent) => void;
  dismissReady: (orderId: OrderId) => void;
  dismissUnavailable: (productId: ProductId) => void;
  clear: () => void;
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: new Map(),
  preparos: new Map(),
  preparoByOrder: new Map(),
  readyAlerts: [],
  unavailableQueue: [],

  setSnapshot(orders, preparos) {
    const ordersMap = new Map<OrderId, Order>();
    const preparosMap = new Map<PreparoId, Preparo>();
    const byOrder = new Map<OrderId, PreparoId>();
    for (const o of orders) ordersMap.set(o.id, o);
    for (const p of preparos) {
      preparosMap.set(p.id, p);
      byOrder.set(p.orderId, p.id);
    }
    set({
      orders: ordersMap,
      preparos: preparosMap,
      preparoByOrder: byOrder,
    });
  },

  applyEvent(event) {
    const cur = get();
    if (event.type === 'order:created') {
      const order = event.payload.order;
      const next = new Map(cur.orders);
      next.set(order.id, order);
      set({ orders: next });
    } else if (event.type === 'prep:started') {
      const preparo = event.payload.preparo;
      const preparos = new Map(cur.preparos);
      preparos.set(preparo.id, preparo);
      const byOrder = new Map(cur.preparoByOrder);
      byOrder.set(preparo.orderId, preparo.id);
      const orders = new Map(cur.orders);
      const existing = orders.get(preparo.orderId);
      if (existing) {
        orders.set(preparo.orderId, { ...existing, status: 'preparando' });
      }
      set({ preparos, preparoByOrder: byOrder, orders });
    } else if (event.type === 'prep:ready') {
      const { orderId, preparoId, readyAt } = event.payload;
      const preparos = new Map(cur.preparos);
      const existing = preparos.get(preparoId);
      if (existing) {
        preparos.set(preparoId, { ...existing, status: 'pronto', readyAt });
      }
      const orders = new Map(cur.orders);
      const order = orders.get(orderId);
      if (order) {
        orders.set(orderId, { ...order, status: 'pronto' });
      }
      set({
        preparos,
        orders,
        readyAlerts: cur.readyAlerts.includes(orderId)
          ? cur.readyAlerts
          : [...cur.readyAlerts, orderId],
      });
    } else if (event.type === 'order:cancel') {
      const { orderId } = event.payload;
      const orders = new Map(cur.orders);
      const order = orders.get(orderId);
      if (order) {
        orders.set(orderId, { ...order, status: 'cancelado' });
      }
      set({ orders });
    } else if (event.type === 'item:unavailable') {
      const { productId, suggestedSubstitutes } = event.payload;
      const already = cur.unavailableQueue.some((u) => u.productId === productId);
      if (!already) {
        set({
          unavailableQueue: [
            ...cur.unavailableQueue,
            { productId, suggestedSubstitutes, receivedAt: Date.now() },
          ],
        });
      }
    }
  },

  dismissReady(orderId) {
    set((s) => ({ readyAlerts: s.readyAlerts.filter((id) => id !== orderId) }));
  },

  dismissUnavailable(productId) {
    set((s) => ({
      unavailableQueue: s.unavailableQueue.filter((u) => u.productId !== productId),
    }));
  },

  clear() {
    set({
      orders: new Map(),
      preparos: new Map(),
      preparoByOrder: new Map(),
      readyAlerts: [],
      unavailableQueue: [],
    });
  },
}));

export const selectPreparoForOrder = (s: OrdersState, orderId: OrderId): Preparo | null => {
  const preparoId = s.preparoByOrder.get(orderId);
  return preparoId ? (s.preparos.get(preparoId) ?? null) : null;
};
