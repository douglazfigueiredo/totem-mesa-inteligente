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
