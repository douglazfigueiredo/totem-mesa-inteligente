import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, schema } from '@/db';
import type { Tenant } from '@/db/schema';

export type OwnerTenant = Tenant & { role: string };

export type CurrentOwner = {
  ownerId: string;
  email: string;
  name: string | null;
  image: string | null;
  tenants: OwnerTenant[];
  activeTenant: OwnerTenant | null;
};

const ACTIVE_TENANT_COOKIE = 'active_tenant_slug';

export async function getCurrentOwner(): Promise<CurrentOwner | null> {
  // Bypass pra E2E — só funciona em ambientes não-produção. Pega o
  // primeiro owner do DB (seed de E2E garante que há exatamente um).
  if (process.env.E2E_BYPASS_AUTH === 'true' && process.env.NODE_ENV !== 'production') {
    const [first] = await db.select().from(schema.owners).limit(1);
    if (!first) return null;
    const rows = await db
      .select({ tenant: schema.tenants, role: schema.tenantOwners.role })
      .from(schema.tenantOwners)
      .innerJoin(schema.tenants, eq(schema.tenantOwners.tenantId, schema.tenants.id))
      .where(eq(schema.tenantOwners.ownerId, first.id));
    const tenants: OwnerTenant[] = rows.map((r) => ({ ...r.tenant, role: r.role }));
    return {
      ownerId: first.id,
      email: first.email ?? '',
      name: first.name ?? null,
      image: first.image ?? null,
      tenants,
      activeTenant: tenants[0] ?? null,
    };
  }

  const session = await auth();
  if (!session?.user) return null;

  const ownerId = (session.user as typeof session.user & { id?: string }).id;
  if (!ownerId) return null;

  const rows = await db
    .select({ tenant: schema.tenants, role: schema.tenantOwners.role })
    .from(schema.tenantOwners)
    .innerJoin(schema.tenants, eq(schema.tenantOwners.tenantId, schema.tenants.id))
    .where(eq(schema.tenantOwners.ownerId, ownerId));

  const tenants: OwnerTenant[] = rows.map((r) => ({ ...r.tenant, role: r.role }));

  const cookieStore = await cookies();
  const slug = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;
  const activeTenant = tenants.find((t) => t.slug === slug) ?? tenants[0] ?? null;

  return {
    ownerId,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    tenants,
    activeTenant,
  };
}

export async function requireOwner(): Promise<CurrentOwner> {
  const owner = await getCurrentOwner();
  if (!owner) redirect('/login');
  return owner;
}

export { ACTIVE_TENANT_COOKIE };
