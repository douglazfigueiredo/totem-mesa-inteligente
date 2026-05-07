'use client';

import { useEffect } from 'react';

export default function TotemError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('totem route error', error);
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
        gap: 18,
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
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700 }}>
        ops, isso não deveria acontecer
      </h1>
      <p style={{ fontSize: 14, opacity: 0.75, maxWidth: 360 }}>
        {error.message || 'erro inesperado nesta tela.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="btn btn-primary"
        style={{ padding: '14px 32px' }}
      >
        tentar de novo
      </button>
    </main>
  );
}
