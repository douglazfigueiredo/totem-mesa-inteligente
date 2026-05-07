import Link from 'next/link';

const NAV = [
  { href: '/admin', label: 'visão geral', icon: '🏠', soon: false },
  { href: '/admin/cardapio', label: 'cardápio', icon: '📋', soon: false },
  { href: '/admin/mesas', label: 'mesas', icon: '🪑', soon: true },
  { href: '/admin/funcionarios', label: 'funcionários', icon: '👥', soon: true },
  { href: '/admin/hubs', label: 'hubs', icon: '🛰', soon: false },
  { href: '/admin/pedidos', label: 'pedidos', icon: '📦', soon: true },
  { href: '/admin/config', label: 'config', icon: '⚙', soon: false },
];

export const Sidebar = () => {
  return (
    <aside className="flex w-60 flex-col border-r border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="px-5 py-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            TotemMesa
          </span>
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            cloud
          </span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-4">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.soon ? '#' : item.href}
            aria-disabled={item.soon}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              item.soon
                ? 'cursor-not-allowed text-[var(--color-ink-mute)]'
                : 'text-[var(--color-ink-soft)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]'
            }`}
          >
            <span aria-hidden>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.soon && (
              <span className="mono rounded bg-[var(--color-soft)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--color-ink-mute)]">
                em breve
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="border-t border-[var(--color-line)] p-4">
        <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          fase 6E.1 ✓ · ingestão
        </p>
      </div>
    </aside>
  );
};
