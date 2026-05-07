'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';

const IdSchema = z.string().uuid();

const PAIRING_TTL_MS = 10 * 60 * 1000;

function generate6DigitCode() {
  // 100000-999999 — 900k codes; com TTL de 10min e codes únicos por tenant
  // a chance de colisão é desprezível, mas se tornar-se um problema, podemos
  // adicionar retry/unique constraint.
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function generatePairingCodeAction() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) throw new Error('sem tenant ativo');

  const code = generate6DigitCode();
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS);

  await db.insert(schema.hubPairings).values({
    tenantId: tenant.id,
    code,
    expiresAt,
    createdByOwnerId: owner.ownerId,
  });

  revalidatePath('/admin/hubs');
}

export async function revokePairingCodeAction(formData: FormData) {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) throw new Error('sem tenant ativo');
  const id = IdSchema.parse(formData.get('id'));

  await db
    .delete(schema.hubPairings)
    .where(
      and(
        eq(schema.hubPairings.id, id),
        eq(schema.hubPairings.tenantId, tenant.id),
      ),
    );

  revalidatePath('/admin/hubs');
}

export async function unpairHubAction(formData: FormData) {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) throw new Error('sem tenant ativo');
  const id = IdSchema.parse(formData.get('id'));

  await db
    .delete(schema.hubs)
    .where(and(eq(schema.hubs.id, id), eq(schema.hubs.tenantId, tenant.id)));

  revalidatePath('/admin/hubs');
}
