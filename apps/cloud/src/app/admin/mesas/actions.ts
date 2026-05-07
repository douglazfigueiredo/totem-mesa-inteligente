'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { withFeedback, type ActionState } from '@/lib/actions';

const NumeroSchema = z.coerce.number().int().min(1, 'número ≥ 1').max(999);
const CapacidadeSchema = z.coerce.number().int().min(1, 'capacidade ≥ 1').max(50);
const IdSchema = z.string().uuid();

async function activeTenantOrFail() {
  const owner = await requireOwner();
  if (!owner.activeTenant) throw new Error('sem tenant ativo');
  return owner.activeTenant;
}

export async function createTableAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('mesa criada', async () => {
    const tenant = await activeTenantOrFail();
    const numero = NumeroSchema.parse(formData.get('numero'));
    const capacidade = CapacidadeSchema.parse(formData.get('capacidade') ?? 4);

    const existing = await db
      .select({ id: schema.tables.id })
      .from(schema.tables)
      .where(and(eq(schema.tables.tenantId, tenant.id), eq(schema.tables.numero, numero)))
      .limit(1);
    if (existing[0]) throw new Error(`mesa ${numero} já existe`);

    await db.insert(schema.tables).values({
      tenantId: tenant.id,
      numero,
      capacidade,
    });

    revalidatePath('/admin/mesas');
  });
}

export async function updateTableAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('mesa atualizada', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));
    const numero = NumeroSchema.parse(formData.get('numero'));
    const capacidade = CapacidadeSchema.parse(formData.get('capacidade'));

    const conflict = await db
      .select({ id: schema.tables.id })
      .from(schema.tables)
      .where(and(eq(schema.tables.tenantId, tenant.id), eq(schema.tables.numero, numero)))
      .limit(1);
    if (conflict[0] && conflict[0].id !== id) throw new Error(`mesa ${numero} já existe`);

    await db
      .update(schema.tables)
      .set({ numero, capacidade, updatedAt: new Date() })
      .where(and(eq(schema.tables.id, id), eq(schema.tables.tenantId, tenant.id)));

    revalidatePath('/admin/mesas');
  });
}

export async function toggleTableActiveAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));

    await db
      .update(schema.tables)
      .set({
        isActive: sql`NOT ${schema.tables.isActive}`,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.tables.id, id), eq(schema.tables.tenantId, tenant.id)));

    revalidatePath('/admin/mesas');
  });
}

export async function deleteTableAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('mesa removida', async () => {
    const tenant = await activeTenantOrFail();
    const id = IdSchema.parse(formData.get('id'));

    await db
      .delete(schema.tables)
      .where(and(eq(schema.tables.id, id), eq(schema.tables.tenantId, tenant.id)));

    revalidatePath('/admin/mesas');
  });
}
