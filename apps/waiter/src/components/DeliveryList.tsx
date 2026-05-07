'use client';

import { useMemo, useState } from 'react';
import type { Order, OrderId } from '@app/schemas';
import { useWaiterStore } from '@/lib/waiter-store';
import { useAuthStore } from '@/lib/auth-store';
import { deliverOrder, HubError } from '@/lib/hub-client';
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
  const apiKey = useAuthStore((s) => s.apiKey);
  const employeeId = useAuthStore((s) => s.employeeId);

  const [busyId, setBusyId] = useState<OrderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleOrders = useMemo(() => {
    const list: Order[] = [];
    for (const o of orders.values()) {
      if (deliveredIds.has(o.id)) continue;
      if (o.status === 'cancelado' || o.status === 'entregue') continue;
      if (o.status === 'pronto' || o.destino === 'garcom') {
        list.push(o);
      }
    }
    list.sort(sortReadyFirst);
    return list;
  }, [orders, deliveredIds]);

  const handleServed = async (orderId: OrderId) => {
    if (!apiKey || !employeeId) {
      markDelivered(orderId);
      return;
    }
    setBusyId(orderId);
    setError(null);
    try {
      await deliverOrder(apiKey, orderId, employeeId);
      markDelivered(orderId);
    } catch (err) {
      if (err instanceof HubError) setError(`${err.code}: ${err.message}`);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setBusyId(null);
    }
  };

  if (visibleOrders.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>nada pra entregar</p>
        <p className={styles.emptyHint}>aguardando preparos ficarem prontos...</p>
      </div>
    );
  }

  return (
    <>
      {error && <div className={styles.errorBar}>{error}</div>}
      <div className={styles.list}>
        {visibleOrders.map((o) => (
          <DeliveryCard
            key={o.id}
            order={o}
            table={tablesById.get(o.tableId) ?? null}
            onServed={() => {
              if (busyId !== o.id) handleServed(o.id);
            }}
          />
        ))}
      </div>
    </>
  );
};
