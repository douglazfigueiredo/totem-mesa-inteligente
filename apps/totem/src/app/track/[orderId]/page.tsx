'use client';

export default function TrackStub() {
  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 28,
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontSize: 36,
          margin: 0,
        }}
      >
        timer real-time
      </h1>
      <p style={{ color: 'var(--ink-soft)', marginTop: 8 }}>
        em construção — Fase 3C (Socket.IO + anel de progresso server-authoritative).
      </p>
    </main>
  );
}
