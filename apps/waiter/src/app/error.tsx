'use client';

import { useEffect } from 'react';

export default function WaiterError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('waiter route error', error);
  }, [error]);

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        gap: 14,
      }}
    >
      <span style={{ fontSize: 48 }}>⚠️</span>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: 0.6,
        }}
      >
        algo deu errado
      </p>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>tela quebrou</h1>
      <p style={{ fontSize: 13, opacity: 0.75, maxWidth: 320 }}>
        {error.message || 'erro inesperado.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn btn-primary"
        style={{ padding: '12px 24px' }}
      >
        tentar de novo
      </button>
    </main>
  );
}
