'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { withFeedback, type ActionState } from '@/lib/actions';

const IdSchema = z.string().uuid();

const PAIRING_TTL_MS = 10 * 60 * 1000;

function generate6DigitCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function generatePairingCodeAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  return withFeedback('código gerado — válido por 10min', async () => {
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
  });
}

export async function revokePairingCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('código revogado', async () => {
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
  });
}

export async function unpairHubAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('hub despareado', async () => {
    const owner = await requireOwner();
    const tenant = owner.activeTenant;
    if (!tenant) throw new Error('sem tenant ativo');
    const id = IdSchema.parse(formData.get('id'));

    await db
      .delete(schema.hubs)
      .where(and(eq(schema.hubs.id, id), eq(schema.hubs.tenantId, tenant.id)));

    revalidatePath('/admin/hubs');
  });
}
