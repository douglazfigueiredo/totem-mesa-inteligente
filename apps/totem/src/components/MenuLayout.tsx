'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useCartStore, cartItemCount } from '@/lib/cart-store';
import styles from './MenuLayout.module.css';

export const MenuLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const tableNumero = useAuthStore((s) => s.tableNumero);
  const items = useCartStore((s) => s.items);
  const count = cartItemCount(items);

  return (
    <main className={styles.wrap}>
      <header className={styles.topbar}>
        <button className={styles.brand} onClick={() => router.push('/')}>
          ← TotemMesa
        </button>
        <span className={styles.tag}>mesa {String(tableNumero ?? '?').padStart(2, '0')}</span>
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
