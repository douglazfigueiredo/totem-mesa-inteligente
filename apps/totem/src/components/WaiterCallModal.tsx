'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { hubFetch, HubError } from '@/lib/hub-client';
import { enqueue } from '@/lib/outbox';
import styles from './WaiterCallModal.module.css';

type Reason = 'talheres' | 'agua' | 'ajuda_pedido' | 'fechar_conta' | 'outros';
type Status = 'form' | 'submitting' | 'pending' | 'queued' | 'error';

const REASONS: { id: Reason; emoji: string; label: string }[] = [
  { id: 'talheres', emoji: '🍴', label: 'talheres' },
  { id: 'agua', emoji: '💧', label: 'água' },
  { id: 'ajuda_pedido', emoji: '🤝', label: 'ajuda no pedido' },
  { id: 'fechar_conta', emoji: '🧾', label: 'fechar conta' },
];

type Props = { onClose: () => void };

export const WaiterCallModal = ({ onClose }: Props) => {
  const auth = useAuthStore();
  const [selected, setSelected] = useState<Reason | null>(null);
  const [obs, setObs] = useState('');
  const [status, setStatus] = useState<Status>('form');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!auth.apiKey || !auth.tableId || !selected) return;
    setError(null);
    setStatus('submitting');
    const eventId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const body = { tableId: auth.tableId, reason: selected, obs: obs || undefined };
    try {
      await hubFetch('/waiter/calls', {
        method: 'POST',
        apiKey: auth.apiKey,
        eventId,
        body,
      });
      setStatus('pending');
    } catch (err) {
      // Erro de rede / hub fora — enfileira pra retentar
      const isNetwork = !(err instanceof HubError) || err.status >= 500;
      if (isNetwork && auth.apiKey) {
        try {
          await enqueue({
            id: eventId,
            type: 'waiter-call',
            path: '/waiter/calls',
            method: 'POST',
            body,
            apiKey: auth.apiKey,
            eventId,
          });
          setStatus('queued');
          return;
        } catch {
          // fallthrough pra mostrar erro original
        }
      }
      setError(err instanceof HubError ? `${err.code}: ${err.message}` : String(err));
      setStatus('error');
    }
  };

  return (
    <div className={`${styles.overlay} fade-up`} role="dialog" aria-modal="true">
      <div className={styles.card}>
        {(status === 'form' || status === 'submitting' || status === 'error') && (
          <>
            <button className={styles.closeBtn} onClick={onClose} aria-label="fechar">
              ✕
            </button>
            <h2 className={styles.title}>precisa de algo?</h2>
            <p className={styles.subtitle}>escolha um motivo, o garçom será avisado.</p>

            <div className={styles.grid}>
              {REASONS.map((r) => (
                <button
                  key={r.id}
                  className={`${styles.reason} ${selected === r.id ? styles.selected : ''}`}
                  onClick={() => setSelected(r.id)}
                >
                  <span className={styles.reasonEmoji}>{r.emoji}</span>
                  <span className={styles.reasonLabel}>{r.label}</span>
                </button>
              ))}
            </div>

            <textarea
              className={styles.textarea}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="observação (opcional)"
              maxLength={200}
              rows={2}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={!selected || status === 'submitting'}
              style={{ width: '100%' }}
            >
              {status === 'submitting' ? 'chamando...' : 'chamar garçom'}
            </button>
          </>
        )}

        {status === 'pending' && (
          <div className={styles.success}>
            <div className={styles.bell}>🛎️</div>
            <h2 className={styles.title}>garçom a caminho...</h2>
            <p className={styles.subtitle}>
              {selected && REASONS.find((r) => r.id === selected)?.label}
            </p>
            <button className="btn btn-secondary" onClick={onClose}>
              fechar
            </button>
          </div>
        )}

        {status === 'queued' && (
          <div className={styles.success}>
            <div className={styles.bell}>📡</div>
            <h2 className={styles.title}>em fila — sem conexão</h2>
            <p className={styles.subtitle}>
              o chamado será enviado assim que o totem reconectar.
            </p>
            <button className="btn btn-secondary" onClick={onClose}>
              fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
