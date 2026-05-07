import { Sidebar } from '@/components/Sidebar';
import { AdminHeader } from '@/components/AdminHeader';
import { Toaster } from '@/components/Toaster';
import { requireOwner } from '@/lib/tenant';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const owner = await requireOwner();

  if (!owner.activeTenant) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6">
        <div className="w-full max-w-md rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-8 text-center shadow-[var(--shadow-card)]">
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            sem loja vinculada
          </span>
          <h1
            className="mt-1 text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <em className="font-semibold italic">conta sem acesso</em>
          </h1>
          <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
            seu e-mail <strong>{owner.email}</strong> ainda não está vinculado a nenhuma loja. fale
            com o administrador da sua pizzaria.
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

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <AdminHeader tenantName={owner.activeTenant.nome} ownerEmail={owner.email} />
        <main className="flex-1 overflow-y-auto bg-[var(--color-bg)] p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
