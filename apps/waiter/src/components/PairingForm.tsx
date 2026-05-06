'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { pairDevice, HubError } from '@/lib/hub-client';
import styles from './PairingForm.module.css';

export const PairingForm = () => {
  const router = useRouter();
  const setPaired = useAuthStore((s) => s.setPaired);

  const [code, setCode] = useState('');
  const [nome, setNome] = useState('Garçom');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await pairDevice({ code, nome });
      setPaired({
        apiKey: result.apiKey,
        deviceId: result.device.id,
        tenantId: result.device.tenantId,
        deviceNome: result.device.nome,
      });
      router.replace('/');
    } catch (err) {
      if (err instanceof HubError) setError(`${err.code}: ${err.message}`);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>parear app</h1>
      <p className={styles.subtitle}>peça ao gerente um código de pareamento (role: waiter).</p>

      <label className={styles.field}>
        <span className="mono-label">código de 6 dígitos</span>
        <input
          className={styles.input}
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          required
          autoFocus
        />
      </label>

      <label className={styles.field}>
        <span className="mono-label">nome do dispositivo</span>
        <input
          className={styles.input}
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={40}
          required
        />
      </label>

      <button type="submit" className="btn btn-primary" disabled={submitting || !code || !nome}>
        {submitting ? 'pareando...' : 'parear →'}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
};
