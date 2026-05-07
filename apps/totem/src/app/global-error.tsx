'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('totem global error', error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fbf6ee',
          color: '#2a1f17',
          padding: 24,
          margin: 0,
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <span style={{ fontSize: 56, display: 'block', marginBottom: 12 }}>⚠️</span>
          <p
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 2,
              opacity: 0.6,
              marginBottom: 12,
            }}
          >
            erro crítico
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            o totem precisa reiniciar
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 20 }}>
            {error.message || 'erro inesperado.'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '14px 28px',
              borderRadius: 12,
              background: '#c14a26',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
