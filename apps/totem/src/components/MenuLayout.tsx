'use client';

import { useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore, cartItemCount } from '@/lib/cart-store';
import { useOrdersStore } from '@/lib/orders-store';
import { useTenantConfig } from '@/lib/tenant-config-store';
import { WaiterCallButton } from './WaiterCallButton';
import styles from './MenuLayout.module.css';

export const MenuLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const tableNumero = useAuthStore((s) => s.tableNumero);
  const items = useCartStore((s) => s.items);
  const count = cartItemCount(items);
  const ordersMap = useOrdersStore((s) => s.orders);
  const cfg = useTenantConfig();

  const { activeCount, latestActiveId } = useMemo(() => {
    let n = 0;
    let latestId: string | null = null;
    let latestAt = 0;
    for (const o of ordersMap.values()) {
      if (['criado', 'enviado', 'preparando', 'pronto'].includes(o.status)) {
        n++;
        if (o.createdAt > latestAt) {
          latestAt = o.createdAt;
          latestId = o.id;
        }
      }
    }
    return { activeCount: n, latestActiveId: latestId };
  }, [ordersMap]);

  return (
    <main className={styles.wrap}>
      <header className={styles.topbar}>
        <div className={styles.left}>
          <button
            className={styles.backBtn}
            onClick={() => router.push(pathname === '/menu' ? '/' : '/menu')}
            aria-label="voltar"
          >
            ←
          </button>
          <span className={styles.brand}>{cfg.brand}</span>
          <span className={styles.tag}>mesa {String(tableNumero ?? '?').padStart(2, '0')}</span>
        </div>
        <div className={styles.right}>
          {activeCount > 0 && latestActiveId && (
            <button
              className={styles.actionBtn}
              onClick={() => router.push(`/track/${latestActiveId}`)}
            >
              <span aria-hidden>📋</span>
              <span>pedidos · {activeCount}</span>
            </button>
          )}
          <WaiterCallButton variant="text" />
        </div>
      </header>

      <div className={styles.content}>{children}</div>

      {count > 0 && (
        <button className={styles.cartFab} onClick={() => router.push('/cart')}>
          <span className={styles.cartCount}>{count}</span>
          <span>ver carrinho →</span>
        </button>
      )}
    </main>
  );
};
