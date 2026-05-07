'use client';

import { useEffect } from 'react';
import { create } from 'zustand';

type Tone = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  tone: Tone;
  message: string;
};

type State = {
  toasts: Toast[];
  push: (tone: Tone, message: string) => void;
  dismiss: (id: number) => void;
};

let nextId = 1;
const AUTO_DISMISS_MS = 4000;

export const useToastStore = create<State>((set) => ({
  toasts: [],
  push: (tone, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, tone, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, AUTO_DISMISS_MS);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message: string) => useToastStore.getState().push('success', message),
  error: (message: string) => useToastStore.getState().push('error', message),
  info: (message: string) => useToastStore.getState().push('info', message),
};

/**
 * Hook helper: dispara um toast quando `result` mudar pra um valor não-nulo.
 * Útil pra integrar com `useActionState`.
 */
export function useToastOnResult(
  result: { ok: boolean; message: string } | null | undefined,
) {
  const push = useToastStore((s) => s.push);
  useEffect(() => {
    if (!result) return;
    push(result.ok ? 'success' : 'error', result.message);
  }, [result, push]);
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex min-w-[260px] max-w-[420px] items-start gap-2 rounded-xl border px-4 py-3 text-left text-sm shadow-[var(--shadow-card)] transition ${toneCls(t.tone)}`}
        >
          <span aria-hidden className="text-base leading-none">
            {iconFor(t.tone)}
          </span>
          <span className="flex-1">{t.message}</span>
          <span className="mono text-[9px] uppercase tracking-widest opacity-50">×</span>
        </button>
      ))}
    </div>
  );
}

function toneCls(tone: Tone) {
  switch (tone) {
    case 'success':
      return 'border-[color:rgb(107_123_58_/_0.4)] bg-white text-[var(--color-ink)]';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-900';
    default:
      return 'border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)]';
  }
}

function iconFor(tone: Tone) {
  switch (tone) {
    case 'success':
      return '✓';
    case 'error':
      return '⚠';
    default:
      return 'i';
  }
}
