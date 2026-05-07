import Link from 'next/link';

export default function AdminNotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 py-12">
      <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        404
      </span>
      <h1
        className="text-3xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        <em className="font-semibold italic">página</em> não encontrada
      </h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        a rota que você acessou não existe ou foi movida.
      </p>
      <Link
        href="/admin"
        className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        voltar pra visão geral
      </Link>
    </div>
  );
}
