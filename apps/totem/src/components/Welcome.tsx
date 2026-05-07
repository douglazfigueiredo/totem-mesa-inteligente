'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useOrdersStore } from '@/lib/orders-store';
import { WaiterCallModal } from './WaiterCallModal';
import styles from './Welcome.module.css';

const TENANT_BRAND = process.env.NEXT_PUBLIC_TENANT_BRAND ?? 'Pizzaria Dev';
const TENANT_AREA = process.env.NEXT_PUBLIC_TENANT_AREA ?? 'salão principal';
const TENANT_SINCE = process.env.NEXT_PUBLIC_TENANT_SINCE ?? 'desde 2026';
const TENANT_HERO_IMG = process.env.NEXT_PUBLIC_TENANT_HERO_IMG ?? '';
const WIFI_SSID = process.env.NEXT_PUBLIC_WIFI_SSID ?? 'pizzaria-livre';
const WIFI_PASS = process.env.NEXT_PUBLIC_WIFI_PASS ?? 'margherita';

const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 12) return 'bom dia';
  if (h < 18) return 'boa tarde';
  return 'boa noite';
};

export const Welcome = () => {
  const router = useRouter();
  const tableNumero = useAuthStore((s) => s.tableNumero);
  const clear = useAuthStore((s) => s.clear);
  const ordersMap = useOrdersStore((s) => s.orders);
  const [waiterOpen, setWaiterOpen] = useState(false);

  const mesaLabel = `mesa ${String(tableNumero ?? '?').padStart(2, '0')}`;
  const greet = greeting();
  const greetParts = greet.split(' ');

  const { activeCount, latestActiveId, latestStatus } = useMemo(() => {
    let n = 0;
    let latestId: string | null = null;
    let latestAt = 0;
    let status = '';
    for (const o of ordersMap.values()) {
      if (['criado', 'enviado', 'preparando', 'pronto'].includes(o.status)) {
        n++;
        if (o.createdAt > latestAt) {
          latestAt = o.createdAt;
          latestId = o.id;
          status = o.status;
        }
      }
    }
    return { activeCount: n, latestActiveId: latestId, latestStatus: status };
  }, [ordersMap]);

  return (
    <main className={`${styles.wrap} fade-up`}>
      <header className={styles.topbar}>
        <div className={styles.brandRow}>
          <span className={styles.brand}>{TENANT_BRAND}</span>
          <span className={styles.tag}>{mesaLabel}</span>
        </div>

        {activeCount > 0 && latestActiveId && (
          <button
            className={`${styles.activeBadge} ${latestStatus === 'pronto' ? styles.activeBadgeReady : ''}`}
            onClick={() => router.push(`/track/${latestActiveId}`)}
          >
            <span className={styles.activeDot} />
            <span className={styles.activeText}>
              {activeCount} pedido{activeCount > 1 ? 's' : ''}{' '}
              {latestStatus === 'pronto' ? 'pronto' : 'em preparo'}
            </span>
            <span className={styles.activeArrow} aria-hidden>
              →
            </span>
          </button>
        )}
      </header>

      <section className={styles.grid}>
        <div className={styles.left}>
          <div className={styles.copy}>
            <span className={styles.locLabel}>
              {mesaLabel} · {TENANT_AREA}
            </span>
            <h1 className={styles.headline}>
              <em>{greetParts[0]}</em> {greetParts.slice(1).join(' ')},<br />o que vai ser?
            </h1>
            <p className={styles.subtitle}>
              peça aqui mesmo, acompanhe o preparo em tempo real e chame o garçom quando precisar.
            </p>

            <div className={styles.actions}>
              <button
                className={`${styles.bigBtn} ${styles.primary}`}
                onClick={() => router.push('/menu')}
              >
                <span>ver cardápio</span>
                <span className={styles.arrow} aria-hidden>
                  →
                </span>
              </button>
              <button
                className={`${styles.bigBtn} ${styles.secondary}`}
                onClick={() => setWaiterOpen(true)}
              >
                <span>
                  <span aria-hidden>🛎</span> chamar garçom
                </span>
                <span className={styles.arrow} aria-hidden>
                  →
                </span>
              </button>
            </div>
          </div>

          <div className={styles.footer}>
            <p className={styles.wifi}>
              WiFi · {WIFI_SSID} <span className={styles.wifiSep}>·</span> senha · {WIFI_PASS}
            </p>
            <button className={styles.debugBtn} onClick={clear}>
              desemparelhar (debug)
            </button>
          </div>
        </div>

        <aside
          className={styles.hero}
          style={TENANT_HERO_IMG ? { backgroundImage: `url(${TENANT_HERO_IMG})` } : undefined}
        >
          {!TENANT_HERO_IMG && <span className={styles.heroPlaceholder}>🍕</span>}
          <span className={styles.sinceTag}>{TENANT_SINCE}</span>
        </aside>
      </section>

      {waiterOpen && <WaiterCallModal onClose={() => setWaiterOpen(false)} />}
    </main>
  );
};
