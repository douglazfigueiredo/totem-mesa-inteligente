'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('admin route error', error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4 py-12">
      <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        algo deu errado
      </span>
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <em className="font-semibold italic">erro</em> ao carregar este painel
      </h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        {error.message || 'erro inesperado.'}
        {error.digest && (
          <span className="mono ml-2 rounded bg-[var(--color-soft)] px-2 py-0.5 text-[10px] text-[var(--color-ink-mute)]">
            {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          tentar de novo
        </button>
        <a
          href="/admin"
          className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-semibold text-[var(--color-ink-soft)] transition hover:bg-[var(--color-warm)]"
        >
          voltar pra visão geral
        </a>
      </div>
    </div>
  );
}
