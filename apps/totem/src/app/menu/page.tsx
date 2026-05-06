'use client';

export default function MenuPage() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        textAlign: 'center',
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 40,
            color: 'var(--ink)',
            margin: '0 0 8px',
          }}
        >
          cardápio
        </h1>
        <p style={{ color: 'var(--ink-soft)' }}>em construção — Fase 3B (catálogo + carrinho).</p>
      </div>
    </main>
  );
}
