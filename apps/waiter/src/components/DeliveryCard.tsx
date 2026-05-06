'use client';

import { useEffect, useState } from 'react';
import type { Order, Table } from '@app/schemas';
import { formatAge } from '@/lib/format';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import styles from './DeliveryCard.module.css';

type Props = {
  order: Order;
  table: Table | null;
  onServed: () => void;
};

export const DeliveryCard = ({ order, table, onServed }: Props) => {
  const driftMs = useSocketStore((s) => s.driftMs);
  const [now, setNow] = useState(() => correctedNow(driftMs));

  useEffect(() => {
    const id = setInterval(() => setNow(correctedNow(driftMs)), 5000);
    return () => clearInterval(id);
  }, [driftMs]);

  const isReady = order.status === 'pronto';

  return (
    <article className={`${styles.card} ${isReady ? styles.ready : styles.queued} fade-up`}>
      <header className={styles.head}>
        <div>
          <span className={styles.mesa}>
            mesa {table ? String(table.numero).padStart(2, '0') : '??'}
          </span>
          <span className={styles.idShort}>#{order.id.slice(0, 6)}</span>
        </div>
        <span className={styles.age}>{formatAge(order.createdAt, now)}</span>
      </header>

      <ul className={styles.items}>
        {order.items.map((it) => (
          <li key={it.id} className={styles.item}>
            <span className={styles.qty}>{it.qty}×</span>
            <span className={styles.name}>{it.nome}</span>
          </li>
        ))}
      </ul>

      <footer className={styles.foot}>
        <span className={isReady ? styles.statusReady : styles.statusQueued}>
          {isReady ? 'pronto na cozinha' : `${order.status}`}
        </span>
        {isReady && (
          <button type="button" className="btn btn-success" onClick={onServed}>
            servir ✓
          </button>
        )}
      </footer>
    </article>
  );
};
