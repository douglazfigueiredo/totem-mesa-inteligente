'use client';

import { useEffect } from 'react';
import { useOrdersStore } from '@/lib/orders-store';
import styles from './ReadyOverlay.module.css';

export const ReadyOverlay = () => {
  const readyAlerts = useOrdersStore((s) => s.readyAlerts);
  const orders = useOrdersStore((s) => s.orders);
  const dismiss = useOrdersStore((s) => s.dismissReady);

  const top = readyAlerts[0] ?? null;
  const order = top ? orders.get(top) : null;

  useEffect(() => {
    if (!top) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.([200, 100, 200]);
    }
  }, [top]);

  if (!top || !order) return null;

  return (
    <div className={`${styles.overlay} fade-up`} role="dialog" aria-modal="true">
      <div className={styles.card}>
        <div className={`${styles.bell} ${styles.bellShake}`}>🔔</div>
        <h2 className={styles.title}>tá pronto!</h2>
        <p className={styles.subtitle}>seu pedido está saindo da cozinha</p>
        <ul className={styles.itemList}>
          {order.items.map((i) => (
            <li key={i.id}>
              {i.qty}× {i.nome}
            </li>
          ))}
        </ul>
        <button className="btn btn-primary" onClick={() => dismiss(top)}>
          fechar
        </button>
      </div>
    </div>
  );
};
