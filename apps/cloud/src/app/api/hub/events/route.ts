import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { WSEvent, type WSEvent as WSEventType } from '@app/schemas';
import { db, schema } from '@/db';

export const dynamic = 'force-dynamic';

const BodySchema = z.union([WSEvent, z.array(WSEvent).max(500)]);

function unauthorized(message = 'unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

function log(level: 'info' | 'warn' | 'error', msg: string, ctx: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](
    JSON.stringify({ level, msg, route: 'POST /api/hub/events', ...ctx }),
  );
}

export async function POST(req: Request) {
  const start = Date.now();
  const requestId = req.headers.get('x-vercel-id') ?? crypto.randomUUID();

  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return unauthorized('missing bearer token');
  const apiKey = m[1].trim();
  if (apiKey.length < 16) return unauthorized();

  const [hub] = await db
    .select({ id: schema.hubs.id, tenantId: schema.hubs.tenantId })
    .from(schema.hubs)
    .where(eq(schema.hubs.apiKey, apiKey));
  if (!hub) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid event(s)', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const events: WSEventType[] = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  // Rejeita eventos cujo tenantId não bate com o hub que autenticou
  const wrongTenant = events.find((e) => e.tenantId !== hub.tenantId);
  if (wrongTenant) {
    log('warn', 'tenant mismatch', { requestId, hubId: hub.id, eventId: wrongTenant.eventId });
    return NextResponse.json({ error: 'tenant mismatch' }, { status: 403 });
  }

  // Atualiza last_seen_at em paralelo
  const lastSeenPromise = db
    .update(schema.hubs)
    .set({ lastSeenAt: new Date() })
    .where(eq(schema.hubs.id, hub.id));

  let inserted = 0;
  let materialized = 0;

  for (const ev of events) {
    const result = await db
      .insert(schema.orderEvents)
      .values({
        eventId: ev.eventId,
        tenantId: hub.tenantId,
        hubId: hub.id,
        type: ev.type,
        payload: ev.payload,
        causedBy: ev.causedBy ?? null,
        eventTs: new Date(ev.ts),
      })
      .onConflictDoNothing({ target: schema.orderEvents.eventId })
      .returning({ eventId: schema.orderEvents.eventId });

    if (result.length === 0) continue; // duplicado, já tinha
    inserted++;

    const applied = await applyToOrders(hub.tenantId, ev);
    if (applied) materialized++;
  }

  await lastSeenPromise.catch((err) => {
    console.warn('[events] falha ao atualizar last_seen_at:', err);
  });

  log('info', 'events ingested', {
    requestId,
    hubId: hub.id,
    received: events.length,
    inserted,
    materialized,
    ms: Date.now() - start,
  });

  return NextResponse.json({
    received: events.length,
    inserted,
    duplicates: events.length - inserted,
    materialized,
  });
}

/**
 * Aplica o evento na tabela `orders` (view materializada).
 * Retorna true se mudou linha; false se evento ignorado pra essa view.
 */
async function applyToOrders(tenantId: string, ev: WSEventType): Promise<boolean> {
  if (ev.type === 'order:created') {
    const o = ev.payload.order;
    await db
      .insert(schema.orders)
      .values({
        id: o.id,
        tenantId,
        tableId: o.tableId,
        status: o.status,
        destino: o.destino,
        items: o.items,
        subtotalCents: o.subtotalCents,
        taxaServicoBps: o.taxaServicoBps,
        taxaServicoCents: o.taxaServicoCents,
        totalCents: o.totalCents,
        obs: o.obs ?? null,
        createdAt: new Date(o.createdAt),
        sentAt: o.sentAt ? new Date(o.sentAt) : null,
        cancelledAt: o.cancelledAt ? new Date(o.cancelledAt) : null,
        cancelReason: o.cancelReason ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: schema.orders.id,
        set: {
          status: o.status,
          items: o.items,
          subtotalCents: o.subtotalCents,
          totalCents: o.totalCents,
          updatedAt: new Date(),
        },
      });
    return true;
  }

  if (ev.type === 'prep:started') {
    await db
      .update(schema.orders)
      .set({
        status: 'preparando',
        preparoStartedAt: new Date(ev.payload.preparo.startedAt),
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, ev.payload.preparo.orderId));
    return true;
  }

  if (ev.type === 'prep:ready') {
    await db
      .update(schema.orders)
      .set({
        status: 'pronto',
        readyAt: new Date(ev.payload.readyAt),
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, ev.payload.orderId));
    return true;
  }

  if (ev.type === 'order:delivered') {
    await db
      .update(schema.orders)
      .set({
        status: 'entregue',
        deliveredAt: new Date(ev.payload.deliveredAt),
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, ev.payload.orderId));
    return true;
  }

  if (ev.type === 'order:cancel') {
    await db
      .update(schema.orders)
      .set({
        status: 'cancelado',
        cancelledAt: new Date(ev.ts),
        cancelReason: ev.payload.reason,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, ev.payload.orderId));
    return true;
  }

  // outros eventos (heartbeat, state:sync, waiter:*, item:unavailable,
  // tenant:config-updated) ficam só no log — não materializam aqui
  return false;
}
