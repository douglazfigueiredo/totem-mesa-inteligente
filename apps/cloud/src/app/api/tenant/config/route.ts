import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { TenantConfig } from '@app/schemas';
import { db, schema } from '@/db';

export const dynamic = 'force-dynamic';

function unauthorized(message = 'unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function GET(req: Request) {
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

  // Atualiza last_seen_at em fire-and-forget (mesmo padrão do snapshot)
  const lastSeenPromise = db
    .update(schema.hubs)
    .set({ lastSeenAt: new Date() })
    .where(eq(schema.hubs.id, hub.id));

  const [t] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, hub.tenantId));
  if (!t) {
    return NextResponse.json({ error: 'tenant not found' }, { status: 500 });
  }

  const config = {
    tenantId: t.id,
    nome: t.nome,
    brand: t.brand ?? null,
    area: t.area ?? null,
    sinceLabel: t.sinceLabel ?? null,
    heroImageUrl: t.heroImageUrl ?? null,
    wifiSsid: t.wifiSsid ?? null,
    wifiPass: t.wifiPass ?? null,
    updatedAt: t.updatedAt.getTime(),
  };

  const parsed = TenantConfig.safeParse(config);
  if (!parsed.success) {
    console.error('[tenant-config] validação falhou', parsed.error.issues);
    return NextResponse.json(
      { error: 'config inválida', issues: parsed.error.issues },
      { status: 500 },
    );
  }

  await lastSeenPromise.catch((err) => {
    console.warn('[tenant-config] falha ao atualizar last_seen_at:', err);
  });

  return NextResponse.json(parsed.data, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Tenant-Config-Version': String(t.updatedAt.getTime()),
    },
  });
}
