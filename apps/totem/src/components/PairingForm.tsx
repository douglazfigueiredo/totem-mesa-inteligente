'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { pairDevice, listTables, HubError, type PairingTable } from '@/lib/hub-client';
import styles from './PairingForm.module.css';

export const PairingForm = () => {
  const router = useRouter();
  const setPaired = useAuthStore((s) => s.setPaired);

  const [code, setCode] = useState('');
  const [tableId, setTableId] = useState('');
  const [tables, setTables] = useState<PairingTable[]>([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTables()
      .then(({ tables }) => {
        if (cancelled) return;
        setTables(tables);
        if (tables[0]) setTableId(tables[0].id);
      })
      .catch((err) => {
        if (!cancelled)
          setError(`não consegui buscar mesas: ${err instanceof Error ? err.message : err}`);
      })
      .finally(() => {
        if (!cancelled) setTablesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTable = tables.find((t) => t.id === tableId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await pairDevice({
        code,
        nome: `Totem Mesa ${selectedTable.numero}`,
        tableId,
      });
      setPaired({
        apiKey: result.apiKey,
        deviceId: result.device.id,
        tenantId: result.device.tenantId,
        tableId: result.device.tableId ?? tableId,
        tableNumero: selectedTable.numero,
      });
      router.replace('/');
    } catch (err) {
      if (err instanceof HubError) {
        setError(`${err.code}: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'erro desconhecido');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>parear totem</h1>
      <p className={styles.subtitle}>peça ao gerente um código de pareamento e selecione a mesa.</p>

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
        <span className="mono-label">mesa</span>
        <select
          className={styles.input}
          value={tableId}
          onChange={(e) => setTableId(e.target.value)}
          required
          disabled={tablesLoading || tables.length === 0}
        >
          {tablesLoading && <option>carregando mesas...</option>}
          {!tablesLoading && tables.length === 0 && <option>nenhuma mesa cadastrada</option>}
          {tables.map((t) => (
            <option key={t.id} value={t.id}>
              mesa {String(t.numero).padStart(2, '0')} ({t.capacidade} lugares)
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="btn btn-primary"
        disabled={submitting || tablesLoading || !code || !tableId}
      >
        {submitting ? 'pareando...' : 'parear →'}
      </button>

      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
};
