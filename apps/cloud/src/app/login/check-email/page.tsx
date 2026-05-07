import Link from 'next/link';

export default function CheckEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-8 text-center shadow-[var(--shadow-card)]">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warm)]">
          <span className="text-2xl">✉</span>
        </div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          confira seu e-mail
        </span>
        <h1
          className="mt-1 text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">link enviado</em>
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          enviamos um link mágico pro seu e-mail. clica nele pra entrar no painel — válido por 24
          horas.
        </p>
        <p className="mono mt-4 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          se não chegar, confira a caixa de spam.
        </p>

        <div className="mt-6">
          <Link
            href="/login"
            className="text-sm text-[var(--color-ink-soft)] underline-offset-4 hover:underline"
          >
            ← voltar pro login
          </Link>
        </div>
      </div>
    </main>
  );
}
