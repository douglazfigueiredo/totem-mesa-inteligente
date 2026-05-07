'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useOrdersStore } from '@/lib/orders-store';
import { useTenantConfig } from '@/lib/tenant-config-store';
import { WaiterCallModal } from './WaiterCallModal';
import styles from './Welcome.module.css';

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
  const cfg = useTenantConfig();
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
          <span className={styles.brand}>{cfg.brand}</span>
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
              {mesaLabel} · {cfg.area}
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
              WiFi · {cfg.wifiSsid} <span className={styles.wifiSep}>·</span> senha · {cfg.wifiPass}
            </p>
            <button className={styles.debugBtn} onClick={clear}>
              desemparelhar (debug)
            </button>
          </div>
        </div>

        <aside
          className={styles.hero}
          style={cfg.heroImageUrl ? { backgroundImage: `url(${cfg.heroImageUrl})` } : undefined}
        >
          {!cfg.heroImageUrl && <span className={styles.heroPlaceholder}>🍕</span>}
          <span className={styles.sinceTag}>{cfg.sinceLabel}</span>
        </aside>
      </section>

      {waiterOpen && <WaiterCallModal onClose={() => setWaiterOpen(false)} />}
    </main>
  );
};
