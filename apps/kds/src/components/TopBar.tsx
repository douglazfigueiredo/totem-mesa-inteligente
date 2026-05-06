'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useSocketStore } from '@/lib/socket-client';
import styles from './TopBar.module.css';

const formatClock = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const TopBar = () => {
  const deviceNome = useAuthStore((s) => s.deviceNome);
  const employeeNome = useAuthStore((s) => s.employeeNome);
  const logout = useAuthStore((s) => s.logoutEmployee);
  const driftMs = useSocketStore((s) => s.driftMs);

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.brand}>KDS</span>
        {deviceNome && <span className={styles.device}>{deviceNome}</span>}
      </div>

      <div className={styles.right}>
        {now && <span className={styles.clock}>{formatClock(now)}</span>}
        {driftMs !== null && Math.abs(driftMs) > 2000 && (
          <span className={styles.drift}>drift {Math.round(driftMs / 1000)}s</span>
        )}
        {employeeNome && (
          <>
            <span className={styles.user}>{employeeNome}</span>
            <button type="button" className={styles.logout} onClick={logout}>
              sair
            </button>
          </>
        )}
      </div>
    </header>
  );
};
