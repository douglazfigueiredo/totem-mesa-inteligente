import { NextResponse } from 'next/server';
import { eq, max } from 'drizzle-orm';
import { EmployeesSnapshot } from '@app/schemas';
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

  const lastSeenPromise = db
    .update(schema.hubs)
    .set({ lastSeenAt: new Date() })
    .where(eq(schema.hubs.id, hub.id));

  const [rows, [{ latest }]] = await Promise.all([
    db
      .select({
        id: schema.employees.id,
        nome: schema.employees.nome,
        pinHash: schema.employees.pinHash,
        roles: schema.employees.roles,
        isActive: schema.employees.isActive,
      })
      .from(schema.employees)
      .where(eq(schema.employees.tenantId, hub.tenantId))
      .orderBy(schema.employees.nome),
    db
      .select({ latest: max(schema.employees.updatedAt) })
      .from(schema.employees)
      .where(eq(schema.employees.tenantId, hub.tenantId)),
  ]);

  const updatedAt = latest ? new Date(latest).getTime() : Date.now();

  const snapshot = {
    tenantId: hub.tenantId,
    employees: rows,
    updatedAt,
  };

  const parsed = EmployeesSnapshot.safeParse(snapshot);
  if (!parsed.success) {
    console.error('[employees] validação falhou', parsed.error.issues);
    return NextResponse.json(
      { error: 'snapshot inválido', issues: parsed.error.issues },
      { status: 500 },
    );
  }

  await lastSeenPromise.catch((err) => {
    console.warn('[employees] falha ao atualizar last_seen_at:', err);
  });

  return NextResponse.json(parsed.data, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Employees-Version': String(updatedAt),
    },
  });
}
