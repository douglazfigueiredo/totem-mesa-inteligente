'use client';

import { useEffect, useState } from 'react';
import type { Order, Preparo, Table } from '@app/schemas';
import { computeRemainingSec } from '@app/schemas';
import { formatTime } from '@/lib/format';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import { useOrdersStore } from '@/lib/orders-store';
import styles from './TicketCard.module.css';

type Props = {
  order: Order;
  preparo: Preparo | null;
  table: Table | null;
  onStartPrep: (order: Order) => void;
  onConfirmReady: (orderId: string) => void;
};

const formatWait = (createdAt: number, nowMs: number): string => {
  const diff = Math.max(0, Math.floor((nowMs - createdAt) / 1000));
  return formatTime(diff);
};

export const TicketCard = ({ order, preparo, table, onStartPrep, onConfirmReady }: Props) => {
  const driftMs = useSocketStore((s) => s.driftMs);
  const hide = useOrdersStore((s) => s.hide);
  const [now, setNow] = useState(() => correctedNow(driftMs));

  useEffect(() => {
    const id = setInterval(() => setNow(correctedNow(driftMs)), 1000);
    return () => clearInterval(id);
  }, [driftMs]);

  const status = order.status;
  const isPreparando = status === 'preparando' && preparo;
  const isPronto = status === 'pronto' && preparo;
  const remainingSec =
    isPreparando && preparo
      ? computeRemainingSec({ startedAt: preparo.startedAt, durationSec: preparo.durationSec }, now)
      : 0;
  const overdue = isPreparando && remainingSec === 0;

  const stateClass = isPronto
    ? styles.pronto
    : overdue
      ? styles.overdue
      : isPreparando
        ? styles.preparando
        : styles.novo;

  return (
    <article className={`${styles.card} ${stateClass} fade-up`}>
      <header className={styles.head}>
        <div>
          <span className={styles.mesa}>
            mesa {table ? String(table.numero).padStart(2, '0') : '??'}
          </span>
          <span className={styles.idShort}>#{order.id.slice(0, 6)}</span>
        </div>
        <span className={styles.statusTag}>
          {status === 'criado' || status === 'enviado'
            ? 'novo'
            : status === 'preparando'
              ? overdue
                ? 'atrasado'
                : 'preparando'
              : status === 'pronto'
                ? 'pronto'
                : status}
        </span>
      </header>

      <ul className={styles.items}>
        {order.items.map((it) => (
          <li key={it.id} className={styles.item}>
            <span className={styles.qty}>{it.qty}×</span>
            <span className={styles.name}>{it.nome}</span>
            {it.customization?.obs && <em className={styles.obs}>{it.customization.obs}</em>}
          </li>
        ))}
      </ul>

      <footer className={styles.foot}>
        {!isPreparando && !isPronto && (
          <>
            <span className={styles.timer}>aberto há {formatWait(order.createdAt, now)}</span>
            <button
              type="button"
              className={`${styles.action} btn btn-primary`}
              onClick={() => onStartPrep(order)}
            >
              iniciar preparo →
            </button>
          </>
        )}

        {isPreparando && preparo && (
          <>
            <span className={`${styles.timer} ${overdue ? styles.timerOver : ''}`}>
              {overdue ? 'atrasou' : formatTime(remainingSec)}
            </span>
            <button
              type="button"
              className={`${styles.action} btn btn-success`}
              onClick={() => onConfirmReady(order.id)}
            >
              concluir →
            </button>
          </>
        )}

        {isPronto && (
          <>
            <span className={styles.timer}>aguardando garçom</span>
            <button
              type="button"
              className={`${styles.action} btn btn-secondary`}
              onClick={() => hide(order.id)}
            >
              ocultar
            </button>
          </>
        )}
      </footer>
    </article>
  );
};
