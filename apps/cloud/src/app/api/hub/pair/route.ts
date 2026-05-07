import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'code must be 6 digits'),
  hubName: z.string().trim().min(1).max(80).optional(),
});

function log(level: 'info' | 'warn' | 'error', msg: string, ctx: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console[level === 'error' ? 'error' : 'log'](
    JSON.stringify({ level, msg, route: 'POST /api/hub/pair', ...ctx }),
  );
}

export async function POST(req: Request) {
  const requestId = req.headers.get('x-vercel-id') ?? crypto.randomUUID();
  const start = Date.now();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    log('warn', 'invalid json', { requestId });
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    log('warn', 'invalid request', { requestId, issues: parsed.error.issues });
    return NextResponse.json(
      { error: 'invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { code, hubName } = parsed.data;
  const now = new Date();

  try {
    const [pairing] = await db
      .select()
      .from(schema.hubPairings)
      .where(
        and(
          eq(schema.hubPairings.code, code),
          gt(schema.hubPairings.expiresAt, now),
          isNull(schema.hubPairings.consumedAt),
        ),
      );
    if (!pairing) {
      log('warn', 'pairing rejected', { requestId, reason: 'not_found_or_expired' });
      return NextResponse.json(
        { error: 'pairing code not found, expired, or already used' },
        { status: 404 },
      );
    }

    const [tenant] = await db
      .select({ id: schema.tenants.id, slug: schema.tenants.slug, nome: schema.tenants.nome })
      .from(schema.tenants)
      .where(eq(schema.tenants.id, pairing.tenantId));
    if (!tenant) {
      log('error', 'tenant not found for pairing', { requestId, pairingId: pairing.id });
      return NextResponse.json({ error: 'tenant not found' }, { status: 500 });
    }

    const apiKey = randomBytes(32).toString('hex');

    const [hub] = await db
      .insert(schema.hubs)
      .values({
        tenantId: tenant.id,
        nome: hubName ?? `hub-${tenant.slug}`,
        apiKey,
      })
      .returning();

    await db
      .update(schema.hubPairings)
      .set({ consumedAt: now, consumedByHubId: hub.id })
      .where(eq(schema.hubPairings.id, pairing.id));

    log('info', 'pairing consumed', {
      requestId,
      tenantId: tenant.id,
      hubId: hub.id,
      ms: Date.now() - start,
    });

    return NextResponse.json({
      apiKey,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantNome: tenant.nome,
      hubId: hub.id,
      hubNome: hub.nome,
      pairedAt: hub.pairedAt.getTime(),
    });
  } catch (err) {
    log('error', 'pairing failed', {
      requestId,
      error: err instanceof Error ? err.message : String(err),
      ms: Date.now() - start,
    });
    return NextResponse.json({ error: 'internal error' }, { status: 500 });
  }
}
