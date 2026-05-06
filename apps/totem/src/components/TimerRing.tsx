'use client';

import { useEffect, useState } from 'react';
import { computeRemainingSec, type Preparo } from '@app/schemas';
import { correctedNow, useSocketStore } from '@/lib/socket-client';
import { formatTime } from '@/lib/format';
import styles from './TimerRing.module.css';

type Props = {
  preparo: Pick<Preparo, 'startedAt' | 'durationSec' | 'status'>;
  size?: number;
  strokeWidth?: number;
};

export const TimerRing = ({ preparo, size = 320, strokeWidth = 16 }: Props) => {
  const drift = useSocketStore((s) => s.driftMs);
  const [now, setNow] = useState(() => correctedNow(drift));

  useEffect(() => {
    const id = setInterval(() => setNow(correctedNow(drift)), 1000);
    return () => clearInterval(id);
  }, [drift]);

  const remaining = computeRemainingSec(preparo, now);
  const total = preparo.durationSec;
  const progress = total > 0 ? Math.min(1, (total - remaining) / total) : 1;
  const isReady = preparo.status === 'pronto' || remaining === 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div className={styles.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-warm)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isReady ? 'var(--green)' : 'var(--terracota)'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 250ms ease' }}
        />
      </svg>
      <div className={styles.label}>
        <span className={styles.time}>{isReady ? '00:00' : formatTime(remaining)}</span>
        <span className={styles.status}>{isReady ? 'pronto!' : 'preparando...'}</span>
      </div>
    </div>
  );
};
