'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { loginPin, HubError } from '@/lib/hub-client';
import styles from './PinForm.module.css';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'];
const MAX = 6;

export const PinForm = () => {
  const router = useRouter();
  const apiKey = useAuthStore((s) => s.apiKey);
  const setEmployee = useAuthStore((s) => s.setEmployee);

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleKey = (k: string) => {
    setError(null);
    if (k === 'C') return setPin('');
    if (k === '←') return setPin((p) => p.slice(0, -1));
    if (pin.length >= MAX) return;
    setPin((p) => p + k);
  };

  const handleSubmit = async () => {
    if (!apiKey || pin.length < 4) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await loginPin(apiKey, pin);
      setEmployee(res.employee);
      router.replace('/');
    } catch (err) {
      if (err instanceof HubError) setError(err.message);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  const dots = Array.from({ length: MAX }, (_, i) => i < pin.length);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>identifique-se</h1>
      <p className={styles.subtitle}>digite seu PIN de operação</p>

      <div className={styles.dots}>
        {dots.map((filled, i) => (
          <span key={i} className={filled ? `${styles.dot} ${styles.dotOn}` : styles.dot} />
        ))}
      </div>

      <div className={styles.pad}>
        {KEYS.map((k) => (
          <button
            key={k}
            type="button"
            className={styles.key}
            onClick={() => handleKey(k)}
            disabled={submitting}
          >
            {k}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={submitting || pin.length < 4}
      >
        {submitting ? 'verificando...' : 'entrar →'}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};
