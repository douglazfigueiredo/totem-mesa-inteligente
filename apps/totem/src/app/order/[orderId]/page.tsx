'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isPaired, useAuthStore } from '@/lib/auth-store';
import { hubFetch, HubError } from '@/lib/hub-client';
import { formatBRL, formatTime } from '@/lib/format';
import styles from './page.module.css';

type Order = {
  id: string;
  status: string;
  totalCents: number;
  items: Array<{ id: string; nome: string; qty: number; tempoEstimadoSec: number }>;
};

export default function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const router = useRouter();
  const auth = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isPaired(auth)) router.replace('/pair');
  }, [hydrated, auth, router]);

  useEffect(() => {
    if (!auth.apiKey) return;
    let cancelled = false;
    hubFetch<Order>(`/orders/${orderId}`, { apiKey: auth.apiKey })
      .then((o) => {
        if (!cancelled) setOrder(o);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof HubError ? `${err.code}: ${err.message}` : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [auth.apiKey, orderId]);

  if (!hydrated || !isPaired(auth)) return <main style={{ flex: 1 }} />;

  const longestPrep = order ? Math.max(...order.items.map((i) => i.tempoEstimadoSec), 0) : 0;

  return (
    <main className={`${styles.wrap} fade-up`}>
      <div className={styles.icon}>✓</div>
      <h1 className={styles.title}>pedido enviado!</h1>
      {error && <p className={styles.error}>{error}</p>}
      {order && (
        <>
          <p className={styles.subtitle}>
            tempo estimado: <strong>~{formatTime(longestPrep)}</strong>
          </p>
          <p className={styles.total}>total: {formatBRL(order.totalCents)}</p>
          <ul className={styles.itemsList}>
            {order.items.map((i) => (
              <li key={i.id} className={styles.itemRow}>
                <span>
                  {i.qty}× {i.nome}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className={styles.actions}>
        <button className="btn btn-primary" onClick={() => router.push(`/track/${orderId}`)}>
          acompanhar →
        </button>
        <button className="btn btn-secondary" onClick={() => router.push('/menu')}>
          pedir mais
        </button>
      </div>
    </main>
  );
}
