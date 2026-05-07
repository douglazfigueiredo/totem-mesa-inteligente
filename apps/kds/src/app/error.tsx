'use client';

import { useEffect } from 'react';

export default function KdsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('kds route error', error);
  }, [error]);

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        textAlign: 'center',
        gap: 16,
      }}
    >
      <span style={{ fontSize: 56 }}>⚠️</span>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: 0.6,
        }}
      >
        algo deu errado
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>kds precisou parar</h1>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 360 }}>
        {error.message || 'erro inesperado nesta tela.'}
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: '12px 26px',
          borderRadius: 10,
          background: 'var(--gold)',
          color: 'var(--bg-base)',
          border: 'none',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        tentar de novo
      </button>
    </main>
  );
}
