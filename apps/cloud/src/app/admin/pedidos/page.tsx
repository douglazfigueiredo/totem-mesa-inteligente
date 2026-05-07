import Link from 'next/link';
import { and, count, desc, eq, gte, ne, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import type { OrderItem } from '@app/schemas';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ period?: string }>;

const PERIODS = {
  today: { label: 'hoje', hours: 24 },
  '7d': { label: '7 dias', hours: 24 * 7 },
  '30d': { label: '30 dias', hours: 24 * 30 },
} as const;
type PeriodKey = keyof typeof PERIODS;

function isPeriod(v: string | undefined): v is PeriodKey {
  return v === 'today' || v === '7d' || v === '30d';
}

function periodStart(period: PeriodKey): Date {
  if (period === 'today') {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return new Date(Date.now() - PERIODS[period].hours * 60 * 60 * 1000);
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

const STATUS_LABEL: Record<string, string> = {
  criado: 'criado',
  enviado: 'enviado',
  preparando: 'preparando',
  pronto: 'pronto',
  entregue: 'entregue',
  cancelado: 'cancelado',
};

const STATUS_TONE: Record<string, string> = {
  criado: 'bg-[var(--color-soft)] text-[var(--color-ink-soft)]',
  enviado: 'bg-[var(--color-soft)] text-[var(--color-ink)]',
  preparando: 'bg-[var(--color-warm)] text-[var(--color-ink)]',
  pronto: 'bg-[color:rgb(107_123_58_/_0.18)] text-[color:rgb(70_82_38)]',
  entregue: 'bg-[var(--color-paper)] text-[var(--color-ink-mute)] border border-[var(--color-line)]',
  cancelado: 'bg-red-50 text-red-700',
};

export default async function PedidosPage({ searchParams }: { searchParams: SearchParams }) {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const sp = await searchParams;
  const period: PeriodKey = isPeriod(sp.period) ? sp.period : '7d';
  const since = periodStart(period);

  const tenantFilter = and(eq(schema.orders.tenantId, tenant.id), gte(schema.orders.createdAt, since));
  const tenantNotCancelled = and(tenantFilter, ne(schema.orders.status, 'cancelado'));

  const [
    [{ totalCount }],
    [{ avgTicketCents }],
    hourBuckets,
    statusBreakdown,
    recentOrders,
  ] = await Promise.all([
    db
      .select({ totalCount: count(schema.orders.id) })
      .from(schema.orders)
      .where(tenantFilter),
    db
      .select({ avgTicketCents: sql<number>`COALESCE(AVG(${schema.orders.totalCents}), 0)::int` })
      .from(schema.orders)
      .where(tenantNotCancelled),
    db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${schema.orders.createdAt})::int`,
        n: count(schema.orders.id),
      })
      .from(schema.orders)
      .where(tenantNotCancelled)
      .groupBy(sql`EXTRACT(HOUR FROM ${schema.orders.createdAt})`),
    db
      .select({
        status: schema.orders.status,
        n: count(schema.orders.id),
      })
      .from(schema.orders)
      .where(tenantFilter)
      .groupBy(schema.orders.status),
    db
      .select()
      .from(schema.orders)
      .where(tenantFilter)
      .orderBy(desc(schema.orders.createdAt))
      .limit(50),
  ]);

  // Prato campeão — agrega items em JS (jsonb)
  const itemTally = new Map<string, { nome: string; qty: number }>();
  for (const o of recentOrders) {
    if (o.status === 'cancelado') continue;
    const items = o.items as OrderItem[];
    for (const it of items) {
      const cur = itemTally.get(it.productId) ?? { nome: it.nome, qty: 0 };
      cur.qty += it.qty;
      itemTally.set(it.productId, cur);
    }
  }
  const topItem = [...itemTally.values()].sort((a, b) => b.qty - a.qty)[0] ?? null;

  // Bar chart 24h
  const hours = Array.from({ length: 24 }, (_, h) => {
    const found = hourBuckets.find((b) => b.hour === h);
    return { h, n: found?.n ?? 0 };
  });
  const peakN = Math.max(1, ...hours.map((h) => h.n));
  const peakHour = hours.reduce((acc, cur) => (cur.n > acc.n ? cur : acc), { h: 0, n: 0 });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          pedidos · analytics
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">pedidos</em> & analytics
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          dados puxados via outbox dos hubs locais. atualiza em ~2s após pedido fechado na loja.
        </p>
      </div>

      <PeriodTabs current={period} />

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard
          label="pedidos no período"
          value={String(totalCount)}
          hint={
            statusBreakdown.find((s) => s.status === 'cancelado')
              ? `${statusBreakdown.find((s) => s.status === 'cancelado')?.n ?? 0} cancelados`
              : 'nenhum cancelado'
          }
        />
        <MetricCard
          label="ticket médio"
          value={avgTicketCents > 0 ? formatBRL(avgTicketCents) : '—'}
          hint="exclui cancelados"
        />
        <MetricCard
          label="prato campeão"
          value={topItem ? topItem.nome : '—'}
          hint={topItem ? `${topItem.qty} unidade${topItem.qty === 1 ? '' : 's'}` : 'sem dados'}
        />
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">hora de pico</h2>
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            {peakHour.n > 0 ? `pico às ${String(peakHour.h).padStart(2, '0')}h (${peakHour.n})` : 'sem pedidos'}
          </span>
        </div>
        <HourChart hours={hours} peakN={peakN} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          últimos pedidos ({recentOrders.length})
        </h2>
        {recentOrders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-8 text-center text-sm text-[var(--color-ink-soft)]">
            nenhum pedido neste período.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {recentOrders.map((o) => (
              <OrderRow key={o.id} order={o} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PeriodTabs({ current }: { current: PeriodKey }) {
  return (
    <nav className="flex gap-1 self-start rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-1 shadow-[var(--shadow-card)]">
      {(Object.keys(PERIODS) as PeriodKey[]).map((p) => {
        const active = p === current;
        return (
          <Link
            key={p}
            href={`/admin/pedidos?period=${p}`}
            className={`mono rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-widest transition ${
              active
                ? 'bg-[var(--color-ink)] text-white'
                : 'text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]'
            }`}
          >
            {PERIODS[p].label}
          </Link>
        );
      })}
    </nav>
  );
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
      <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        {label}
      </p>
      <p
        className="mt-2 truncate text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)' }}
        title={value}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{hint}</p>}
    </div>
  );
}

function HourChart({ hours, peakN }: { hours: { h: number; n: number }[]; peakN: number }) {
  return (
    <div className="flex h-32 items-end gap-1">
      {hours.map(({ h, n }) => {
        const pct = (n / peakN) * 100;
        return (
          <div key={h} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-[var(--color-accent)]"
              style={{ height: `${Math.max(2, pct)}%`, minHeight: n > 0 ? 4 : 1, opacity: n > 0 ? 1 : 0.15 }}
              title={`${String(h).padStart(2, '0')}h — ${n} pedido${n === 1 ? '' : 's'}`}
            />
            {h % 4 === 0 && (
              <span className="mono text-[8px] text-[var(--color-ink-mute)]">
                {String(h).padStart(2, '0')}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderRow({ order }: { order: typeof schema.orders.$inferSelect }) {
  const items = order.items as OrderItem[];
  const itemSummary =
    items.length === 1
      ? `${items[0].qty}× ${items[0].nome}`
      : `${items.reduce((s, i) => s + i.qty, 0)} itens · ${items[0].nome}…`;
  const status = order.status;
  const tone = STATUS_TONE[status] ?? STATUS_TONE.criado;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-card)]">
      <div className="mono w-16 shrink-0 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        {formatDate(order.createdAt)}
        <br />
        {formatTime(order.createdAt)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{itemSummary}</p>
        <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          mesa {order.tableId.slice(0, 8)} · {order.destino}
        </p>
      </div>
      <span
        className={`mono shrink-0 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-widest ${tone}`}
      >
        {STATUS_LABEL[status] ?? status}
      </span>
      <div
        className="w-20 shrink-0 text-right text-sm font-semibold"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {formatBRL(order.totalCents)}
      </div>
    </li>
  );
}
