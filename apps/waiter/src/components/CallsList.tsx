'use client';

import { useMemo, useState } from 'react';
import type { WaiterCallId } from '@app/schemas';
import { useAuthStore } from '@/lib/auth-store';
import { useWaiterStore } from '@/lib/waiter-store';
import { ackWaiterCall, resolveWaiterCall, HubError } from '@/lib/hub-client';
import { CallCard } from './CallCard';
import styles from './CallsList.module.css';

const STATUS_PRIORITY = { pending: 0, acknowledged: 1, escalated: 0 } as const;

export const CallsList = () => {
  const apiKey = useAuthStore((s) => s.apiKey);
  const employeeId = useAuthStore((s) => s.employeeId);
  const calls = useWaiterStore((s) => s.calls);
  const tablesById = useWaiterStore((s) => s.tablesById);
  const patchCall = useWaiterStore((s) => s.patchCall);

  const [busyId, setBusyId] = useState<WaiterCallId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleCalls = useMemo(() => {
    const list = [];
    for (const c of calls.values()) {
      if (c.status === 'pending' || c.status === 'acknowledged') list.push(c);
    }
    list.sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] ?? 9;
      const pb = STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.createdAt - b.createdAt;
    });
    return list;
  }, [calls]);

  const handleAck = async (callId: WaiterCallId) => {
    if (!apiKey || !employeeId) return;
    setBusyId(callId);
    setError(null);
    try {
      await ackWaiterCall(apiKey, callId, employeeId);
      patchCall(callId, {
        status: 'acknowledged',
        acknowledgedBy: employeeId as never,
        acknowledgedAt: Date.now(),
      });
    } catch (err) {
      if (err instanceof HubError) setError(`${err.code}: ${err.message}`);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (callId: WaiterCallId) => {
    if (!apiKey || !employeeId) return;
    setBusyId(callId);
    setError(null);
    try {
      await resolveWaiterCall(apiKey, callId, employeeId);
      patchCall(callId, { status: 'resolved', resolvedAt: Date.now() });
    } catch (err) {
      if (err instanceof HubError) setError(`${err.code}: ${err.message}`);
      else setError(err instanceof Error ? err.message : 'erro desconhecido');
    } finally {
      setBusyId(null);
    }
  };

  if (visibleCalls.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>nenhum chamado pendente</p>
        <p className={styles.emptyHint}>aguardando alguém chamar...</p>
      </div>
    );
  }

  return (
    <>
      {error && <div className={styles.errorBar}>{error}</div>}
      <div className={styles.list}>
        {visibleCalls.map((c) => (
          <CallCard
            key={c.id}
            call={c}
            table={tablesById.get(c.tableId) ?? null}
            busy={busyId === c.id}
            onAck={() => handleAck(c.id)}
            onResolve={() => handleResolve(c.id)}
          />
        ))}
      </div>
    </>
  );
};
