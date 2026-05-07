import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="mono text-xs uppercase tracking-widest text-[var(--color-ink-mute)]">
          TotemMesa · cloud
        </span>
        <h1
          className="text-4xl font-bold tracking-tight md:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          painel <em className="italic font-semibold">SaaS</em> de totem-de-mesa
        </h1>
        <p className="max-w-md text-[var(--color-ink-soft)]">
          gestão de cardápio, mesas, pedidos e analytics — um painel por loja, sincronizado com hubs
          locais em tempo real.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/admin"
          className="rounded-xl bg-[var(--color-accent)] px-6 py-3 font-semibold text-white shadow-md transition hover:bg-[var(--color-accent-deep)]"
        >
          entrar no painel →
        </Link>
        <Link
          href="/login"
          className="rounded-xl bg-[var(--color-warm)] px-6 py-3 font-semibold text-[var(--color-ink)] transition hover:opacity-90"
        >
          login
        </Link>
      </div>

      <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        fase 6A · foundation
      </p>
    </main>
  );
}
