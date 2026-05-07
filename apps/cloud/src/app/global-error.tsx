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
    console.error('global error', error);
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
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
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
          <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>
            algo quebrou na aplicação
          </h1>
          <p style={{ fontSize: 14, opacity: 0.75, marginBottom: 20 }}>
            {error.message || 'erro inesperado.'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '10px 20px',
              borderRadius: 10,
              background: '#2a1f17',
              color: '#fff',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
