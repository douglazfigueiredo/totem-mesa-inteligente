'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, max, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';

const NomeSchema = z.string().trim().min(1, 'nome obrigatório').max(80);
const IdSchema = z.string().uuid();

async function activeTenantOrFail() {
  const owner = await requireOwner();
  if (!owner.activeTenant) throw new Error('sem tenant ativo');
  return owner.activeTenant;
}

export async function createCategoryAction(formData: FormData) {
  const tenant = await activeTenantOrFail();
  const nome = NomeSchema.parse(formData.get('nome'));

  const [{ maxOrdem }] = await db
    .select({ maxOrdem: max(schema.categories.ordem) })
    .from(schema.categories)
    .where(eq(schema.categories.tenantId, tenant.id));

  await db.insert(schema.categories).values({
    tenantId: tenant.id,
    nome,
    ordem: (maxOrdem ?? -1) + 1,
  });

  revalidatePath('/admin/cardapio');
}

export async function renameCategoryAction(formData: FormData) {
  const tenant = await activeTenantOrFail();
  const id = IdSchema.parse(formData.get('id'));
  const nome = NomeSchema.parse(formData.get('nome'));

  await db
    .update(schema.categories)
    .set({ nome, updatedAt: new Date() })
    .where(and(eq(schema.categories.id, id), eq(schema.categories.tenantId, tenant.id)));

  revalidatePath('/admin/cardapio');
}

export async function toggleCategoryActiveAction(formData: FormData) {
  const tenant = await activeTenantOrFail();
  const id = IdSchema.parse(formData.get('id'));

  await db
    .update(schema.categories)
    .set({
      isActive: sql`NOT ${schema.categories.isActive}`,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.categories.id, id), eq(schema.categories.tenantId, tenant.id)));

  revalidatePath('/admin/cardapio');
}

export async function moveCategoryAction(formData: FormData) {
  const tenant = await activeTenantOrFail();
  const id = IdSchema.parse(formData.get('id'));
  const direction = z.enum(['up', 'down']).parse(formData.get('direction'));

  const ordered = await db
    .select({ id: schema.categories.id, ordem: schema.categories.ordem })
    .from(schema.categories)
    .where(eq(schema.categories.tenantId, tenant.id))
    .orderBy(schema.categories.ordem);

  const idx = ordered.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];

  // neon-http não suporta transactions. Sem unique constraint em ordem,
  // duas updates sequenciais não conflitam — janela de inconsistência mínima.
  await db
    .update(schema.categories)
    .set({ ordem: b.ordem, updatedAt: new Date() })
    .where(eq(schema.categories.id, a.id));
  await db
    .update(schema.categories)
    .set({ ordem: a.ordem, updatedAt: new Date() })
    .where(eq(schema.categories.id, b.id));

  revalidatePath('/admin/cardapio');
}

export async function deleteCategoryAction(formData: FormData) {
  const tenant = await activeTenantOrFail();
  const id = IdSchema.parse(formData.get('id'));

  await db
    .delete(schema.categories)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.tenantId, tenant.id)));

  revalidatePath('/admin/cardapio');
}
