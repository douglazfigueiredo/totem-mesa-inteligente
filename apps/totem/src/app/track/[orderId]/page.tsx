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

  return (
    <MenuLayout>
      <div className={styles.wrap}>
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
            <TimerRing preparo={preparo} />
            {order && (
              <ul className={styles.items}>
                {order.items.map((i) => (
                  <li key={i.id} className={styles.item}>
                    <span className={styles.qty}>{i.qty}×</span>
                    <span>{i.nome}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        <div className={styles.actions}>
          <button className="btn btn-secondary" onClick={() => router.push('/menu')}>
            pedir mais
          </button>
        </div>
      </div>
    </MenuLayout>
  );
}
