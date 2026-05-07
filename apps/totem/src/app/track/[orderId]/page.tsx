'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrderId } from '@app/schemas';
import { isPaired, useAuthStore } from '@/lib/auth-store';
import { selectPreparoForOrder, useOrdersStore } from '@/lib/orders-store';
import { TimerRing } from '@/components/TimerRing';
import { MenuLayout } from '@/components/MenuLayout';
import styles from './page.module.css';

export default function TrackPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const auth = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isPaired(auth)) router.replace('/pair');
  }, [hydrated, auth, router]);

  const order = useOrdersStore((s) => s.orders.get(orderId as OrderId));
  const preparo = useOrdersStore((s) => selectPreparoForOrder(s, orderId as OrderId));

  if (!hydrated || !isPaired(auth)) return <main style={{ flex: 1 }} />;

  const orderShort = orderId.slice(-4).toUpperCase();

  const statusForCard = (s: string): { label: string; cls: string } => {
    if (s === 'pronto') return { label: 'pronto ✓', cls: styles.dotReady };
    if (s === 'preparando') return { label: 'preparando', cls: styles.dotCooking };
    if (s === 'cancelado') return { label: 'cancelado', cls: styles.dotMuted };
    return { label: 'na fila', cls: styles.dotQueue };
  };

  return (
    <MenuLayout>
      <div className={styles.grid}>
        <section className={styles.left}>
          {!preparo && (
            <div className={styles.waiting}>
              <p className={styles.waitingTitle}>aguardando cozinha aceitar...</p>
              <p className={styles.waitingHint}>
                o timer começa quando a cozinha clicar em &quot;iniciar preparo&quot;.
              </p>
            </div>
          )}

          {preparo && (
            <>
              <span className={styles.headLabel}>
                {preparo.status === 'pronto' ? 'pronto' : 'preparando'} · pedido #{orderShort}
              </span>
              <TimerRing preparo={preparo} size={240} strokeWidth={12} />
              <button className={styles.ghostLink} onClick={() => router.push('/menu')}>
                + pedir mais
              </button>
            </>
          )}
        </section>

        <aside className={styles.right}>
          <span className={styles.sideLabel}>seu pedido</span>
          <div className={styles.card}>
            {order && order.items.length > 0 ? (
              <ul className={styles.items}>
                {order.items.map((i) => {
                  const st = statusForCard(order.status);
                  return (
                    <li key={i.id} className={styles.item}>
                      <span className={styles.thumb} aria-hidden>
                        🍴
                      </span>
                      <div className={styles.itemBody}>
                        <span className={styles.itemName}>
                          {i.qty}× {i.nome}
                        </span>
                        <span className={styles.itemMeta}>
                          <span className={`${styles.dot} ${st.cls}`} />
                          {st.label}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.emptyHint}>carregando pedido...</p>
            )}
          </div>
        </aside>
      </div>
    </MenuLayout>
  );
}
