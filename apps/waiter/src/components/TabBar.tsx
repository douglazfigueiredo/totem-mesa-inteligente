'use client';

import styles from './TabBar.module.css';

export type Tab = 'calls' | 'delivery';

type Props = {
  active: Tab;
  callsBadge: number;
  deliveryBadge: number;
  onChange: (tab: Tab) => void;
};

export const TabBar = ({ active, callsBadge, deliveryBadge, onChange }: Props) => {
  return (
    <nav className={styles.bar}>
      <button
        type="button"
        className={active === 'calls' ? `${styles.tab} ${styles.active}` : styles.tab}
        onClick={() => onChange('calls')}
      >
        <span className={styles.icon}>🛎</span>
        <span className={styles.label}>chamados</span>
        {callsBadge > 0 && <span className={styles.badge}>{callsBadge}</span>}
      </button>
      <button
        type="button"
        className={active === 'delivery' ? `${styles.tab} ${styles.active}` : styles.tab}
        onClick={() => onChange('delivery')}
      >
        <span className={styles.icon}>📋</span>
        <span className={styles.label}>entregar</span>
        {deliveryBadge > 0 && <span className={styles.badge}>{deliveryBadge}</span>}
      </button>
    </nav>
  );
};
