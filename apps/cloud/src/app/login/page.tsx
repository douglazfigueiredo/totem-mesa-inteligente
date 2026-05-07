import Link from 'next/link';
import { signIn, auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const sp = await searchParams;
  if (session?.user) redirect(sp.callbackUrl ?? '/admin');

  async function loginAction(formData: FormData) {
    'use server';
    const email = formData.get('email')?.toString().trim().toLowerCase();
    if (!email) return;
    await signIn('nodemailer', {
      email,
      redirectTo: '/login/check-email',
    });
  }

  const error = sp.error;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-8 shadow-[var(--shadow-card)]">
        <div className="mb-6">
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            painel saas
          </span>
          <h1
            className="mt-1 text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <em className="font-semibold italic">entrar</em> no painel
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            informe seu e-mail e enviamos um link mágico pra você acessar.
          </p>
        </div>

        <form action={loginAction} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
              e-mail
            </span>
            <input
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="voce@pizzaria.com"
              className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-base outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {humanizeError(error)}
            </p>
          )}

          <button
            type="submit"
            className="mt-2 rounded-xl bg-[var(--color-accent)] px-5 py-3 font-semibold text-white shadow-md transition hover:bg-[var(--color-accent-deep)]"
          >
            enviar link de acesso
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link href="/" className="text-[var(--color-ink-soft)] hover:underline">
            ← voltar
          </Link>
        </div>
      </div>
    </main>
  );
}

function humanizeError(code: string) {
  switch (code) {
    case 'EmailSignin':
      return 'não conseguimos enviar o e-mail. confira o endereço e tente de novo.';
    case 'AccessDenied':
      return 'esse e-mail não tem acesso ao painel.';
    default:
      return 'algo deu errado. tente novamente em instantes.';
  }
}
