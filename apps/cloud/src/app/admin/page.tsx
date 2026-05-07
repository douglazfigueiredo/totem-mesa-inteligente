const Card = ({ title, hint, badge }: { title: string; hint: string; badge?: string }) => (
  <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
    <div className="mb-1 flex items-center justify-between">
      <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      {badge && (
        <span className="mono rounded bg-[var(--color-soft)] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[var(--color-ink-mute)]">
          {badge}
        </span>
      )}
    </div>
    <p className="text-sm text-[var(--color-ink-soft)]">{hint}</p>
  </div>
);

export default function AdminHome() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          visão geral
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">olá,</em> dona da pizzaria
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          painel SaaS — escolha uma seção na barra lateral. Funcionalidades chegam nas próximas
          fases.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          title="cardápio"
          hint="categorias, produtos, modificadores, fotos. Source-of-truth do menu."
          badge="6C"
        />
        <Card
          title="hubs locais"
          hint="parear novos hubs (mini-PCs nas lojas), monitorar last-seen, atualizar."
          badge="6D"
        />
        <Card
          title="pedidos & analytics"
          hint="histórico, ticket médio, prato campeão, hora de pico."
          badge="6E"
        />
        <Card
          title="config da loja"
          hint="brand, área, wifi, hero da home — substitui as env vars do totem."
          badge="6F"
        />
        <Card
          title="funcionários"
          hint="garçons, cozinheiros, gerentes. PINs sincronizados com o hub."
          badge="6F"
        />
        <Card
          title="billing"
          hint="plano, ciclo de cobrança, fatura. Integração com Stripe."
          badge="7+"
        />
      </div>

      <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-4 text-sm text-[var(--color-ink-soft)]">
        <p className="mono mb-1 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          fase 6A — foundation
        </p>
        scaffold concluído: Next.js 15, Tailwind v4, Drizzle, schema Postgres
        (tenants/owners/hubs/hub_pairings/auth-tables), NextAuth v5 stub. Login real e dashboards
        reais chegam nas sub-fases 6B → 6F.
      </div>
    </div>
  );
}
