'use client';

import { useMemo, useState } from 'react';
import type { Order } from '@app/schemas';
import { computeRemainingSec } from '@app/schemas';
import { useOrdersStore } from '@/lib/orders-store';
import { useAuthStore } from '@/lib/auth-store';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import { markPrepReady, HubError } from '@/lib/hub-client';
import { TicketCard } from './TicketCard';
import { StartPrepDialog } from './StartPrepDialog';
import styles from './TicketGrid.module.css';

const sortPriority = (
  o: Order,
  preparoStartedAt: number | null,
  preparoDurationSec: number | null,
  now: number,
): number => {
  if (o.status === 'preparando' && preparoStartedAt !== null && preparoDurationSec !== null) {
    const remaining = computeRemainingSec(
      { startedAt: preparoStartedAt, durationSec: preparoDurationSec },
      now,
    );
    return remaining === 0 ? 0 : 2;
  }
  if (o.status === 'criado' || o.status === 'enviado') return 1;
  if (o.status === 'pronto') return 3;
  return 9;
};

export const TicketGrid = () => {
  const orders = useOrdersStore((s) => s.orders);
  const preparos = useOrdersStore((s) => s.preparos);
  const preparoByOrder = useOrdersStore((s) => s.preparoByOrder);
  const tablesById = useOrdersStore((s) => s.tablesById);
  const hiddenIds = useOrdersStore((s) => s.hiddenIds);
  const apiKey = useAuthStore((s) => s.apiKey);
  const driftMs = useSocketStore((s) => s.driftMs);

  const [activeDialog, setActiveDialog] = useState<Order | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleOrders = useMemo(() => {
    const now = correctedNow(driftMs);
    const list: Order[] = [];
    for (const o of orders.values()) {
      if (hiddenIds.has(o.id)) continue;
      if (o.status === 'cancelado' || o.status === 'entregue') continue;
      list.push(o);
    }
    list.sort((a, b) => {
      const pa = preparoByOrder.get(a.id);
      const pb = preparoByOrder.get(b.id);
      const prepA = pa ? preparos.get(pa) : null;
      const prepB = pb ? preparos.get(pb) : null;
      const priA = sortPriority(a, prepA?.startedAt ?? null, prepA?.durationSec ?? null, now);
      const priB = sortPriority(b, prepB?.startedAt ?? null, prepB?.durationSec ?? null, now);
      if (priA !== priB) return priA - priB;
      return a.createdAt - b.createdAt;
    });
    return list;
  }, [orders, preparos, preparoByOrder, hiddenIds, driftMs]);

  const handleConfirmReady = async (orderId: string) => {
    if (!apiKey) return;
    const preparoId = preparoByOrder.get(orderId as Order['id']);
    if (!preparoId) return;
    setBusyOrderId(orderId);
    setError(null);
    try {
      await markPrepReady(apiKey, preparoId);
    } catch (err) {
      if (err instanceof HubError) setError(`${err.code}: ${err.message}`);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setBusyOrderId(null);
    }
  };

  if (visibleOrders.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>nenhum pedido ativo</p>
        <p className={styles.emptyHint}>aguardando novos pedidos do salão...</p>
      </div>
    );
  }

  return (
    <>
      {error && <div className={styles.errorBar}>{error}</div>}
      <div className={styles.grid}>
        {visibleOrders.map((o) => {
          const preparoId = preparoByOrder.get(o.id);
          const preparo = preparoId ? (preparos.get(preparoId) ?? null) : null;
          const table = tablesById.get(o.tableId) ?? null;
          return (
            <TicketCard
              key={o.id}
              order={o}
              preparo={preparo}
              table={table}
              onStartPrep={(order) => setActiveDialog(order)}
              onConfirmReady={(id) => {
                if (busyOrderId !== id) handleConfirmReady(id);
              }}
            />
          );
        })}
      </div>
      {activeDialog && (
        <StartPrepDialog order={activeDialog} onClose={() => setActiveDialog(null)} />
      )}
    </>
  );
};
