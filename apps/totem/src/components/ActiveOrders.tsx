'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { computeRemainingSec } from '@app/schemas';
import { useOrdersStore } from '@/lib/orders-store';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import { formatTime } from '@/lib/format';
import styles from './ActiveOrders.module.css';

const STATUS_LABEL: Record<string, string> = {
  criado: 'aguardando',
  enviado: 'aguardando',
  preparando: 'preparando',
  pronto: 'pronto!',
};

export const ActiveOrders = () => {
  const router = useRouter();
  const ordersMap = useOrdersStore((s) => s.orders);
  const preparosMap = useOrdersStore((s) => s.preparos);
  const byOrder = useOrdersStore((s) => s.preparoByOrder);
  const drift = useSocketStore((s) => s.driftMs);
  const [now, setNow] = useState(() => correctedNow(drift));

  useEffect(() => {
    const id = setInterval(() => setNow(correctedNow(drift)), 1000);
    return () => clearInterval(id);
  }, [drift]);

  const active = useMemo(
    () =>
      [...ordersMap.values()]
        .filter((o) => ['criado', 'enviado', 'preparando', 'pronto'].includes(o.status))
        .sort((a, b) => a.createdAt - b.createdAt),
    [ordersMap],
  );

  if (active.length === 0) return null;

  return (
    <section className={styles.wrap}>
      <h2 className="mono-label">pedidos ativos</h2>
      <ul className={styles.list}>
        {active.map((order) => {
          const preparoId = byOrder.get(order.id);
          const preparo = preparoId ? preparosMap.get(preparoId) : null;
          const remaining = preparo ? computeRemainingSec(preparo, now) : null;
          const isReady = order.status === 'pronto';
          const isWaiterOnly = order.destino === 'garcom';
          const label =
            isReady && isWaiterOnly
              ? 'aguardando garçom'
              : (STATUS_LABEL[order.status] ?? order.status);
          return (
            <li key={order.id} className={`${styles.item} ${isReady ? styles.ready : ''}`}>
              <button onClick={() => router.push(`/track/${order.id}`)}>
                <div className={styles.row}>
                  <span className={styles.status}>{label}</span>
                  {remaining !== null && !isReady && (
                    <span className={styles.time}>{formatTime(remaining)}</span>
                  )}
                </div>
                <div className={styles.items}>
                  {order.items
                    .map((i) => `${i.qty}× ${i.nome}`)
                    .join(' · ')
                    .slice(0, 80)}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
