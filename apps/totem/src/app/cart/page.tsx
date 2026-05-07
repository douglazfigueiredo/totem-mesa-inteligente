'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isPaired, useAuthStore } from '@/lib/auth-store';
import { useCartStore, cartSubtotalCents } from '@/lib/cart-store';
import { useSocketStore } from '@/lib/socket-client';
import { hubFetch, HubError } from '@/lib/hub-client';
import { enqueue } from '@/lib/outbox';
import { formatBRL } from '@/lib/format';
import { MenuLayout } from '@/components/MenuLayout';
import { QtyStepper } from '@/components/QtyStepper';
import styles from './page.module.css';

export default function CartPage() {
  const router = useRouter();
  const auth = useAuthStore();
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const clearCart = useCartStore((s) => s.clear);
  const connectionState = useSocketStore((s) => s.state);

  const [hydrated, setHydrated] = useState(false);
  const [taxaServicoOn, setTaxaServicoOn] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isPaired(auth)) router.replace('/pair');
  }, [hydrated, auth, router]);

  if (!hydrated || !isPaired(auth)) return <main style={{ flex: 1 }} />;

  const subtotal = cartSubtotalCents(items);
  const taxaBps = taxaServicoOn ? 1000 : 0;
  const taxa = Math.round((subtotal * taxaBps) / 10000);
  const total = subtotal + taxa;

  const handleSubmit = async () => {
    if (!auth.apiKey || !auth.tableId || items.length === 0) return;
    setError(null);
    setSubmitting(true);
    const eventId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const body = {
      tableId: auth.tableId,
      items: items.map((i) => ({
        productId: i.productId,
        nome: i.nome,
        destino: i.destino,
        qty: i.qty,
        unitPriceCents: i.unitPriceCents,
        totalPriceCents: i.totalPriceCents,
        tempoEstimadoSec: i.tempoEstimadoSec,
        customization: i.customization,
      })),
      taxaServicoBps: taxaBps,
    };
    try {
      type OrderResp = { id: string; createdAt: number };
      const order = await hubFetch<OrderResp>('/orders', {
        method: 'POST',
        apiKey: auth.apiKey,
        eventId,
        body,
      });
      clearCart();
      router.replace(`/order/${order.id}`);
    } catch (err) {
      const isNetwork = !(err instanceof HubError) || err.status >= 500;
      if (isNetwork && auth.apiKey) {
        try {
          await enqueue({
            id: eventId,
            type: 'order',
            path: '/orders',
            method: 'POST',
            body,
            apiKey: auth.apiKey,
            eventId,
          });
          clearCart();
          setQueued(true);
          return;
        } catch {
          // fallthrough
        }
      }
      setError(err instanceof HubError ? `${err.code}: ${err.message}` : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isOffline = connectionState !== 'connected' && connectionState !== 'idle';

  if (queued) {
    return (
      <MenuLayout>
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>📡</span>
          <h1 className={styles.emptyTitle}>pedido em fila</h1>
          <p className={styles.emptySubtitle}>
            sem conexão com o hub agora. seu pedido foi salvo e será enviado automaticamente assim
            que reconectar.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/menu')}>
            voltar ao cardápio →
          </button>
        </div>
      </MenuLayout>
    );
  }

  if (items.length === 0) {
    return (
      <MenuLayout>
        <div className={styles.empty}>
          <span className={styles.emptyEmoji}>🍽️</span>
          <h1 className={styles.emptyTitle}>carrinho vazio</h1>
          <p className={styles.emptySubtitle}>volte ao cardápio para escolher.</p>
          <button className="btn btn-primary" onClick={() => router.push('/menu')}>
            ver cardápio →
          </button>
        </div>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
      <div className={styles.wrap}>
        <h1 className={styles.title}>seu pedido</h1>
        <ul className={styles.list}>
          {items.map((it) => (
            <li key={it.lineId} className={styles.item}>
              <div className={styles.thumb}>{it.imageUrl ? null : '🍴'}</div>
              <div className={styles.itemBody}>
                <div className={styles.itemHead}>
                  <span className={styles.itemName}>{it.nome}</span>
                  <button className={styles.removeBtn} onClick={() => remove(it.lineId)}>
                    remover
                  </button>
                </div>
                {it.customization?.obs && (
                  <p className={styles.itemObs}>obs: {it.customization.obs}</p>
                )}
                <div className={styles.itemFoot}>
                  <QtyStepper value={it.qty} onChange={(q) => setQty(it.lineId, q)} />
                  <span className={styles.itemPrice}>{formatBRL(it.totalPriceCents)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className={styles.totals}>
          <Row label="subtotal" value={formatBRL(subtotal)} />
          <ToggleRow
            label="taxa de serviço (10%)"
            value={formatBRL(taxa)}
            on={taxaServicoOn}
            onToggle={() => setTaxaServicoOn((v) => !v)}
          />
          <Row label="total" value={formatBRL(total)} big />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {isOffline && (
          <p className={styles.error}>
            sem conexão com o hub — não é possível enviar agora. tente em alguns segundos.
          </p>
        )}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting || isOffline}
          style={{ width: '100%', padding: '18px' }}
        >
          {submitting ? 'enviando...' : isOffline ? 'sem conexão' : 'enviar pedido →'}
        </button>
      </div>
    </MenuLayout>
  );
}

const Row = ({ label, value, big }: { label: string; value: string; big?: boolean }) => (
  <div className={`${styles.totalsRow} ${big ? styles.totalsBig : ''}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const ToggleRow = ({
  label,
  value,
  on,
  onToggle,
}: {
  label: string;
  value: string;
  on: boolean;
  onToggle: () => void;
}) => (
  <div className={styles.totalsRow}>
    <button className={styles.toggleBtn} onClick={onToggle}>
      <span className={`${styles.checkbox} ${on ? styles.checked : ''}`}>{on ? '✓' : ''}</span>
      <span>{label}</span>
    </button>
    <span>{on ? value : '—'}</span>
  </div>
);
