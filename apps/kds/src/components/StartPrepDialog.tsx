'use client';

import { useEffect, useState } from 'react';
import type { Order } from '@app/schemas';
import { useAuthStore } from '@/lib/auth-store';
import { startPrep, HubError } from '@/lib/hub-client';
import styles from './StartPrepDialog.module.css';

type Props = {
  order: Order;
  onClose: () => void;
};

const PRESETS = [
  { label: '5 min', sec: 300 },
  { label: '10 min', sec: 600 },
  { label: '15 min', sec: 900 },
  { label: '20 min', sec: 1200 },
  { label: '30 min', sec: 1800 },
];

const estimateFromOrder = (order: Order): number => {
  const total = order.items.reduce((acc, it) => acc + (it.tempoEstimadoSec || 0) * it.qty, 0);
  return total > 0 ? Math.min(3600, Math.max(120, total)) : 600;
};

export const StartPrepDialog = ({ order, onClose }: Props) => {
  const apiKey = useAuthStore((s) => s.apiKey);
  const employeeId = useAuthStore((s) => s.employeeId);
  const [durationSec, setDurationSec] = useState(() => estimateFromOrder(order));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleConfirm = async () => {
    if (!apiKey || !employeeId) {
      setError('sessão inválida — faça login novamente');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const eventId = globalThis.crypto?.randomUUID?.();
      await startPrep(apiKey, { orderId: order.id, employeeId, durationSec }, eventId);
      onClose();
    } catch (err) {
      if (err instanceof HubError) setError(`${err.code}: ${err.message}`);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog">
        <h2 className={styles.title}>iniciar preparo</h2>
        <p className={styles.subtitle}>
          mesa #{order.id.slice(0, 6)} · {order.items.length} item(s)
        </p>

        <span className="mono-label">duração estimada</span>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button
              key={p.sec}
              type="button"
              className={
                durationSec === p.sec ? `${styles.preset} ${styles.presetOn}` : styles.preset
              }
              onClick={() => setDurationSec(p.sec)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <label className={styles.field}>
          <span className="mono-label">ou ajuste em segundos</span>
          <input
            type="number"
            min={60}
            max={3600}
            step={30}
            value={durationSec}
            onChange={(e) => setDurationSec(Math.max(60, Math.min(3600, Number(e.target.value))))}
            className={styles.input}
          />
        </label>

        <div className={styles.actions}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'iniciando...' : 'iniciar →'}
          </button>
        </div>

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};
