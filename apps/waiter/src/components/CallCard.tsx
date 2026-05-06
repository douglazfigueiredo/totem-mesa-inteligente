'use client';

import { useEffect, useState } from 'react';
import type { Table, WaiterCall } from '@app/schemas';
import { formatAge, reasonLabel } from '@/lib/format';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import styles from './CallCard.module.css';

type Props = {
  call: WaiterCall;
  table: Table | null;
  busy: boolean;
  onAck: () => void;
  onResolve: () => void;
};

export const CallCard = ({ call, table, busy, onAck, onResolve }: Props) => {
  const driftMs = useSocketStore((s) => s.driftMs);
  const [now, setNow] = useState(() => correctedNow(driftMs));

  useEffect(() => {
    const id = setInterval(() => setNow(correctedNow(driftMs)), 5000);
    return () => clearInterval(id);
  }, [driftMs]);

  const isPending = call.status === 'pending';
  const isAcked = call.status === 'acknowledged';

  return (
    <article
      className={`${styles.card} ${isPending ? styles.pending : isAcked ? styles.acked : ''} fade-up`}
    >
      <header className={styles.head}>
        <span className={styles.mesa}>
          mesa {table ? String(table.numero).padStart(2, '0') : '??'}
        </span>
        <span className={styles.age}>{formatAge(call.createdAt, now)}</span>
      </header>

      <p className={styles.reason}>🛎 {reasonLabel(call.reason)}</p>
      {call.obs && <p className={styles.obs}>“{call.obs}”</p>}

      <footer className={styles.foot}>
        {isPending && (
          <button type="button" className="btn btn-primary" onClick={onAck} disabled={busy}>
            atender →
          </button>
        )}
        {isAcked && (
          <>
            <span className={styles.statusTag}>atendendo</span>
            <button type="button" className="btn btn-success" onClick={onResolve} disabled={busy}>
              resolvido ✓
            </button>
          </>
        )}
      </footer>
    </article>
  );
};
