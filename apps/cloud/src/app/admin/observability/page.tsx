import { and, count, eq, gte, sql } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import type { OrderItem } from '@app/schemas';

export const dynamic = 'force-dynamic';

const HUB_OFFLINE_THRESHOLD_MS = 2 * 60_000;
const HUB_ALERT_THRESHOLD_MS = 5 * 60_000;

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function ObservabilityPage() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const now = new Date();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const tenantId = tenant.id;

  const [
    hubs,
    [{ events24h }],
    [{ ordersToday }],
    [{ totalLast7d, cancelLast7d }],
    perDayRows,
    last30dOrders,
    [{ avgLagMs }],
  ] = await Promise.all([
    db.select().from(schema.hubs).where(eq(schema.hubs.tenantId, tenantId)),
    db
      .select({ events24h: count(schema.orderEvents.eventId) })
      .from(schema.orderEvents)
      .where(
        and(
          eq(schema.orderEvents.tenantId, tenantId),
          gte(schema.orderEvents.receivedAt, since24h),
        ),
      ),
    db
      .select({ ordersToday: count(schema.orders.id) })
      .from(schema.orders)
      .where(
        and(eq(schema.orders.tenantId, tenantId), gte(schema.orders.createdAt, startOfToday)),
      ),
    db
      .select({
        totalLast7d: count(schema.orders.id),
        cancelLast7d: sql<number>`COUNT(*) FILTER (WHERE ${schema.orders.status} = 'cancelado')::int`,
      })
      .from(schema.orders)
      .where(and(eq(schema.orders.tenantId, tenantId), gte(schema.orders.createdAt, since7d))),
    db
      .select({
        day: sql<string>`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`,
        n: count(schema.orders.id),
      })
      .from(schema.orders)
      .where(and(eq(schema.orders.tenantId, tenantId), gte(schema.orders.createdAt, since7d)))
      .groupBy(sql`to_char(${schema.orders.createdAt}, 'YYYY-MM-DD')`),
    db
      .select({ items: schema.orders.items })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.tenantId, tenantId),
          gte(schema.orders.createdAt, since30d),
          sql`${schema.orders.status} <> 'cancelado'`,
        ),
      ),
    db
      .select({
        avgLagMs: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${schema.orderEvents.receivedAt} - ${schema.orderEvents.eventTs})) * 1000), 0)::int`,
      })
      .from(schema.orderEvents)
      .where(
        and(
          eq(schema.orderEvents.tenantId, tenantId),
          gte(schema.orderEvents.receivedAt, since24h),
        ),
      ),
  ]);

  const onlineCount = hubs.filter(
    (h) => h.lastSeenAt && Date.now() - h.lastSeenAt.getTime() < HUB_OFFLINE_THRESHOLD_MS,
  ).length;

  const offlineAlerts = hubs.filter(
    (h) => !h.lastSeenAt || Date.now() - h.lastSeenAt.getTime() > HUB_ALERT_THRESHOLD_MS,
  );

  const cancelPct =
    totalLast7d > 0 ? Math.round((Number(cancelLast7d) / totalLast7d) * 100) : 0;

  // Bar chart 7d — preencher dias sem pedidos
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfToday.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    const found = perDayRows.find((r) => r.day === key);
    return { date: d, n: found ? Number(found.n) : 0 };
  });
  const peakN = Math.max(1, ...days.map((d) => d.n));

  // Top 5 produtos (agregando jsonb items)
  const tally = new Map<string, { nome: string; qty: number }>();
  for (const o of last30dOrders) {
    const items = o.items as OrderItem[];
    for (const it of items) {
      const cur = tally.get(it.productId) ?? { nome: it.nome, qty: 0 };
      cur.qty += it.qty;
      tally.set(it.productId, cur);
    }
  }
  const topProducts = [...tally.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topPeak = Math.max(1, ...topProducts.map((p) => p.qty));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          observabilidade · saúde do sistema
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">observabilidade</em>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          métricas vitais da operação — atualiza a cada visita à página.
        </p>
      </div>

      {offlineAlerts.length > 0 && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="mono mb-2 text-[10px] uppercase tracking-widest text-red-700">
            ⚠ {offlineAlerts.length} hub{offlineAlerts.length === 1 ? '' : 's'} offline há mais de 5min
          </div>
          <ul className="flex flex-col gap-1 text-sm text-red-900">
            {offlineAlerts.map((h) => (
              <li key={h.id} className="flex items-center gap-2">
                <span className="font-semibold">{h.nome}</span>
                <span className="mono text-[10px] uppercase tracking-widest opacity-70">
                  {h.lastSeenAt ? `visto há ${formatRelative(h.lastSeenAt)}` : 'nunca conectou'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard
          label="hubs online"
          value={`${onlineCount}/${hubs.length || 0}`}
          tone={hubs.length > 0 && onlineCount === hubs.length ? 'good' : onlineCount > 0 ? 'warn' : 'bad'}
        />
        <MetricCard
          label="eventos 24h"
          value={Number(events24h).toLocaleString('pt-BR')}
          tone={Number(events24h) > 0 ? 'good' : 'mute'}
        />
        <MetricCard
          label="pedidos hoje"
          value={String(ordersToday)}
          tone="mute"
        />
        <MetricCard
          label="taxa cancelamento (7d)"
          value={`${cancelPct}%`}
          tone={cancelPct < 5 ? 'good' : cancelPct < 15 ? 'warn' : 'bad'}
          hint={`${cancelLast7d}/${totalLast7d} pedidos`}
        />
      </section>

      <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">pedidos por dia (últimos 7 dias)</h2>
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            pico: {peakN}
          </span>
        </div>
        <div className="flex h-32 items-end gap-2">
          {days.map(({ date, n }) => {
            const pct = (n / peakN) * 100;
            return (
              <div key={date.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-[var(--color-accent)]"
                  style={{
                    height: `${Math.max(2, pct)}%`,
                    minHeight: n > 0 ? 4 : 1,
                    opacity: n > 0 ? 1 : 0.15,
                  }}
                  title={`${date.toLocaleDateString('pt-BR')} — ${n} pedido${n === 1 ? '' : 's'}`}
                />
                <span className="mono text-[8px] text-[var(--color-ink-mute)]">
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
                </span>
                <span className="mono text-[10px] font-semibold">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            top 5 produtos (30d)
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-soft)]">sem dados ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {topProducts.map((p, idx) => (
                <li key={p.nome} className="flex items-center gap-3">
                  <span className="mono w-6 text-[10px] text-[var(--color-ink-mute)]">
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.nome}</p>
                    <div className="mt-1 h-1 rounded-full bg-[var(--color-soft)]">
                      <div
                        className="h-1 rounded-full bg-[var(--color-accent)]"
                        style={{ width: `${(p.qty / topPeak) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
                    {p.qty}×
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide">
            lag cloud ↔ hub (24h)
          </h2>
          <p
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {Number(avgLagMs) === 0 ? '—' : `${Math.round(Number(avgLagMs) / 100) / 10}s`}
          </p>
          <p className="mt-2 text-xs text-[var(--color-ink-soft)]">
            tempo médio entre evento criado no hub e ingestão no cloud. valores altos (&gt;30s)
            indicam outbox parado ou conexão instável.
          </p>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad' | 'mute';
  hint?: string;
}) {
  const toneClass = {
    good: 'text-[color:rgb(70_82_38)]',
    warn: 'text-[color:rgb(184_134_11)]',
    bad: 'text-red-700',
    mute: 'text-[var(--color-ink)]',
  }[tone];
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[var(--shadow-card)]">
      <p className="mono text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-bold tracking-tight ${toneClass}`}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {value}
      </p>
      {hint && (
        <p className="mono text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          {hint}
        </p>
      )}
    </div>
  );
}
