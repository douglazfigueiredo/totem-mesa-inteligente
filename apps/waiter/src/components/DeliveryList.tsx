'use client';

import { useMemo } from 'react';
import type { Order } from '@app/schemas';
import { useWaiterStore } from '@/lib/waiter-store';
import { DeliveryCard } from './DeliveryCard';
import styles from './DeliveryList.module.css';

const sortReadyFirst = (a: Order, b: Order): number => {
  const ar = a.status === 'pronto' ? 0 : 1;
  const br = b.status === 'pronto' ? 0 : 1;
  if (ar !== br) return ar - br;
  return a.createdAt - b.createdAt;
};

export const DeliveryList = () => {
  const orders = useWaiterStore((s) => s.orders);
  const tablesById = useWaiterStore((s) => s.tablesById);
  const deliveredIds = useWaiterStore((s) => s.deliveredIds);
  const markDelivered = useWaiterStore((s) => s.markDelivered);

  const visibleOrders = useMemo(() => {
    const list: Order[] = [];
    for (const o of orders.values()) {
      if (deliveredIds.has(o.id)) continue;
      if (o.status === 'cancelado' || o.status === 'entregue') continue;
      // Mostra: prontos do KDS (pronto) OU pedidos só do garçom (destino=garcom — bebidas)
      if (o.status === 'pronto' || o.destino === 'garcom') {
        list.push(o);
      }
    }
    list.sort(sortReadyFirst);
    return list;
  }, [orders, deliveredIds]);

  if (visibleOrders.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>nada pra entregar</p>
        <p className={styles.emptyHint}>aguardando preparos ficarem prontos...</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {visibleOrders.map((o) => (
        <DeliveryCard
          key={o.id}
          order={o}
          table={tablesById.get(o.tableId) ?? null}
          onServed={() => markDelivered(o.id)}
        />
      ))}
    </div>
  );
};
