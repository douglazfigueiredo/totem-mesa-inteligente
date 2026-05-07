export const AdminHeader = ({ tenantName }: { tenantName?: string }) => {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-3">
      <div className="flex items-baseline gap-3">
        <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
          {tenantName ?? 'sem tenant selecionado'}
        </span>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          painel
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="mono rounded-md px-2.5 py-1 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)]"
          disabled
        >
          login (Fase 6B)
        </button>
      </div>
    </header>
  );
};
