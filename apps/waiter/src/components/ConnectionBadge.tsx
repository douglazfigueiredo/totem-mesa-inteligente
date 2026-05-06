'use client';

import { useSocketStore } from '@/lib/socket-client';
import styles from './ConnectionBadge.module.css';

export const ConnectionBadge = () => {
  const state = useSocketStore((s) => s.state);

  if (state === 'connected' || state === 'idle') return null;

  const label = {
    connecting: 'conectando ao hub...',
    reconnecting: 'reconectando...',
    offline: 'sem conexão com o hub',
  }[state];

  return <div className={`${styles.banner} ${styles[state]}`}>{label}</div>;
};
