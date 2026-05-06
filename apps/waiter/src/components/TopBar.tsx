'use client';

import { useAuthStore } from '@/lib/auth-store';
import { useWaiterStore } from '@/lib/waiter-store';
import styles from './TopBar.module.css';

export const TopBar = () => {
  const employeeNome = useAuthStore((s) => s.employeeNome);
  const logout = useAuthStore((s) => s.logoutEmployee);
  const calls = useWaiterStore((s) => s.calls);

  let pendingCount = 0;
  for (const c of calls.values()) if (c.status === 'pending') pendingCount++;

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.brand}>garçom</span>
        {employeeNome && <span className={styles.user}>· {employeeNome}</span>}
      </div>

      <div className={styles.right}>
        {pendingCount > 0 && <span className={styles.pendingBadge}>{pendingCount} chamado(s)</span>}
        <button type="button" className={styles.logout} onClick={logout}>
          sair
        </button>
      </div>
    </header>
  );
};
