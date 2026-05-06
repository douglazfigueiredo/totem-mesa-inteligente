'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { computeRemainingSec } from '@app/schemas';
import { useOrdersStore } from '@/lib/orders-store';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import { formatTime } from '@/lib/format';
import styles from './TimerWidget.module.css';

export const TimerWidget = () => {
  const router = useRouter();
  const pathname = usePathname();
  const drift = useSocketStore((s) => s.driftMs);
  const preparosMap = useOrdersStore((s) => s.preparos);
  const preparos = useMemo(
    () => [...preparosMap.values()].filter((p) => p.status === 'preparando'),
    [preparosMap],
  );
  const [now, setNow] = useState(() => correctedNow(drift));

  useEffect(() => {
    const id = setInterval(() => setNow(correctedNow(drift)), 1000);
    return () => clearInterval(id);
  }, [drift]);

  if (preparos.length === 0) return null;
  if (pathname?.startsWith('/track/')) return null;

  const earliest = preparos.reduce((min, p) => {
    const remMin = computeRemainingSec(min, now);
    const remP = computeRemainingSec(p, now);
    return remP < remMin ? p : min;
  }, preparos[0]!);

  const remaining = computeRemainingSec(earliest, now);
  const total = earliest.durationSec;
  const progress = total > 0 ? Math.min(1, (total - remaining) / total) : 1;
  const size = 40;
  const sw = 4;
  const r = (size - sw) / 2;
  const c = 2 * Math.PI * r;

  return (
    <button
      className={`${styles.pill} fade-up`}
      onClick={() => router.push(`/track/${earliest.orderId}`)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-warm)"
          strokeWidth={sw}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--terracota)"
          strokeWidth={sw}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>
      <div className={styles.body}>
        <span className={styles.time}>{formatTime(remaining)}</span>
        <span className={styles.label}>preparando</span>
      </div>
    </button>
  );
};
