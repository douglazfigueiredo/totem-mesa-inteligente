'use client';

import { useEffect, useState } from 'react';
import { useSocketStore } from '@/lib/socket-client';
import styles from './ConnectionBadge.module.css';

const FLASH_DELAY_MS = 1500;

export const ConnectionBadge = () => {
  const state = useSocketStore((s) => s.state);
  const lastConnectedAt = useSocketStore((s) => s.lastConnectedAt);
  const socket = useSocketStore((s) => s.socket);

  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (state === 'connected' || state === 'idle') {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), FLASH_DELAY_MS);
    return () => clearTimeout(id);
  }, [state]);

  useEffect(() => {
    if (!visible) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [visible]);

  if (!visible) return null;

  const labels: Record<string, string> = {
    connecting: 'conectando ao hub...',
    reconnecting: 'reconectando...',
    offline: 'sem conexão com o hub — pedidos bloqueados',
  };
  const label = labels[state];
  if (!label) return null;

  const ago = lastConnectedAt ? Math.max(0, Math.round((now - lastConnectedAt) / 1000)) : null;

  const handleRetry = () => {
    if (!socket) return;
    if (!socket.connected) socket.connect();
  };

  return (
    <div className={`${styles.banner} ${styles[state]}`} role="status" aria-live="polite">
      <span>{label}</span>
      {ago !== null && state !== 'connecting' && (
        <span className={styles.ago}>· última sync há {ago}s</span>
      )}
      {state === 'offline' && (
        <button type="button" className={styles.retry} onClick={handleRetry}>
          tentar agora
        </button>
      )}
    </div>
  );
};
