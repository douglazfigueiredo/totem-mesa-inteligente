'use client';

import { create } from 'zustand';
import type { Order, OrderId, Preparo, PreparoId, Table, TableId, WSEvent } from '@app/schemas';

type OrdersState = {
  orders: Map<OrderId, Order>;
  preparos: Map<PreparoId, Preparo>;
  preparoByOrder: Map<OrderId, PreparoId>;
  tablesById: Map<TableId, Table>;
  hiddenIds: Set<OrderId>;
  newOrderTick: number;

  setSnapshot: (input: { orders: Order[]; preparos: Preparo[]; tables?: Table[] }) => void;
  applyEvent: (event: WSEvent) => void;
  hide: (orderId: OrderId) => void;
};

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: new Map(),
  preparos: new Map(),
  preparoByOrder: new Map(),
  tablesById: new Map(),
  hiddenIds: new Set(),
  newOrderTick: 0,

  setSnapshot({ orders, preparos, tables }) {
    const ordersMap = new Map<OrderId, Order>();
    const preparosMap = new Map<PreparoId, Preparo>();
    const byOrder = new Map<OrderId, PreparoId>();
    const tablesMap = new Map<TableId, Table>();
    for (const o of orders) ordersMap.set(o.id, o);
    for (const p of preparos) {
      preparosMap.set(p.id, p);
      byOrder.set(p.orderId, p.id);
    }
    if (tables) for (const t of tables) tablesMap.set(t.id, t);
    set((cur) => ({
      orders: ordersMap,
      preparos: preparosMap,
      preparoByOrder: byOrder,
      tablesById: tables ? tablesMap : cur.tablesById,
    }));
  },

  applyEvent(event) {
    const cur = get();
    if (event.type === 'order:created') {
      const order = event.payload.order;
      const next = new Map(cur.orders);
      next.set(order.id, order);
      set({ orders: next, newOrderTick: cur.newOrderTick + 1 });
    } else if (event.type === 'prep:started') {
      const preparo = event.payload.preparo;
      const preparos = new Map(cur.preparos);
      preparos.set(preparo.id, preparo);
      const byOrder = new Map(cur.preparoByOrder);
      byOrder.set(preparo.orderId, preparo.id);
      const orders = new Map(cur.orders);
      const existing = orders.get(preparo.orderId);
      if (existing) orders.set(preparo.orderId, { ...existing, status: 'preparando' });
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
      if (order) orders.set(orderId, { ...order, status: 'pronto' });
      set({ preparos, orders });
    } else if (event.type === 'order:cancel') {
      const { orderId } = event.payload;
      const orders = new Map(cur.orders);
      const order = orders.get(orderId);
      if (order) orders.set(orderId, { ...order, status: 'cancelado' });
      set({ orders });
    }
  },

  hide(orderId) {
    set((s) => {
      const next = new Set(s.hiddenIds);
      next.add(orderId);
      return { hiddenIds: next };
    });
  },
}));
