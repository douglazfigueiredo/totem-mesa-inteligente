import { signOut } from '@/lib/auth';

export const AdminHeader = ({
  tenantName,
  ownerEmail,
}: {
  tenantName: string;
  ownerEmail: string;
}) => {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          {tenantName}
        </span>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          painel
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          {ownerEmail}
        </span>
        <form
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            className="mono rounded-md px-2.5 py-1 text-[10px] uppercase tracking-widest text-[var(--color-ink-soft)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
          >
            sair
          </button>
        </form>
      </div>
    </header>
  );
};
