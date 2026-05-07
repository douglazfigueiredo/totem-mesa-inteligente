'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';

const IdSchema = z.string().uuid();
const GroupNomeSchema = z.string().trim().min(1).max(80);
const ModifierNomeSchema = z.string().trim().min(1).max(80);
const SelectionTypeSchema = z.enum(['single', 'multi']);
const PriceDeltaSchema = z.coerce.number().int().min(0).max(10_000_000);
const NonNegInt = z.coerce.number().int().min(0).max(99);
const NonNegIntOpt = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.number().int().min(0).max(99).optional(),
);

async function ensureProductInTenant(productId: string) {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) throw new Error('sem tenant ativo');

  const [product] = await db
    .select({ id: schema.products.id, categoryId: schema.products.categoryId })
    .from(schema.products)
    .where(and(eq(schema.products.id, productId), eq(schema.products.tenantId, tenant.id)));
  if (!product) throw new Error('produto não encontrado');
  return product;
}

async function ensureGroupInProduct(groupId: string, productId: string) {
  const product = await ensureProductInTenant(productId);
  const [group] = await db
    .select()
    .from(schema.modifierGroups)
    .where(
      and(
        eq(schema.modifierGroups.id, groupId),
        eq(schema.modifierGroups.productId, product.id),
      ),
    );
  if (!group) throw new Error('grupo não encontrado');
  return { product, group };
}

/* ── Groups ─────────────────────────────────────────────────────────── */

export async function createGroupAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);
  const nome = GroupNomeSchema.parse(formData.get('nome'));

  const [{ maxOrdem }] = await db
    .select({ maxOrdem: max(schema.modifierGroups.ordem) })
    .from(schema.modifierGroups)
    .where(eq(schema.modifierGroups.productId, product.id));

  await db.insert(schema.modifierGroups).values({
    productId: product.id,
    nome,
    ordem: (maxOrdem ?? -1) + 1,
  });

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function updateGroupAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product } = await ensureGroupInProduct(groupId, productId);

  const nome = GroupNomeSchema.parse(formData.get('nome'));
  const selectionType = SelectionTypeSchema.parse(formData.get('selectionType'));
  const required = formData.get('required') === 'on';
  const minSelect = NonNegInt.parse(formData.get('minSelect') ?? '0');
  const maxSelect = NonNegIntOpt.parse(formData.get('maxSelect'));

  await db
    .update(schema.modifierGroups)
    .set({
      nome,
      selectionType,
      required,
      minSelect,
      maxSelect: maxSelect ?? null,
    })
    .where(eq(schema.modifierGroups.id, groupId));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function moveGroupAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product } = await ensureGroupInProduct(groupId, productId);
  const direction = z.enum(['up', 'down']).parse(formData.get('direction'));

  const ordered = await db
    .select({ id: schema.modifierGroups.id, ordem: schema.modifierGroups.ordem })
    .from(schema.modifierGroups)
    .where(eq(schema.modifierGroups.productId, product.id))
    .orderBy(schema.modifierGroups.ordem);

  const idx = ordered.findIndex((g) => g.id === groupId);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];

  await db
    .update(schema.modifierGroups)
    .set({ ordem: b.ordem })
    .where(eq(schema.modifierGroups.id, a.id));
  await db
    .update(schema.modifierGroups)
    .set({ ordem: a.ordem })
    .where(eq(schema.modifierGroups.id, b.id));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function deleteGroupAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product } = await ensureGroupInProduct(groupId, productId);

  await db.delete(schema.modifierGroups).where(eq(schema.modifierGroups.id, groupId));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

/* ── Modifiers ──────────────────────────────────────────────────────── */

export async function createModifierAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product, group } = await ensureGroupInProduct(groupId, productId);

  const nome = ModifierNomeSchema.parse(formData.get('nome'));
  const reais = String(formData.get('priceDeltaReais') ?? '0').replace(',', '.');
  const priceDeltaCents = PriceDeltaSchema.parse(Math.round(parseFloat(reais || '0') * 100));

  const [{ maxOrdem }] = await db
    .select({ maxOrdem: max(schema.modifiers.ordem) })
    .from(schema.modifiers)
    .where(eq(schema.modifiers.groupId, group.id));

  await db.insert(schema.modifiers).values({
    groupId: group.id,
    nome,
    priceDeltaCents,
    ordem: (maxOrdem ?? -1) + 1,
  });

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function updateModifierAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product, group } = await ensureGroupInProduct(groupId, productId);
  const id = IdSchema.parse(formData.get('id'));

  const nome = ModifierNomeSchema.parse(formData.get('nome'));
  const reais = String(formData.get('priceDeltaReais') ?? '0').replace(',', '.');
  const priceDeltaCents = PriceDeltaSchema.parse(Math.round(parseFloat(reais || '0') * 100));

  await db
    .update(schema.modifiers)
    .set({ nome, priceDeltaCents })
    .where(and(eq(schema.modifiers.id, id), eq(schema.modifiers.groupId, group.id)));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function toggleModifierAvailableAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product, group } = await ensureGroupInProduct(groupId, productId);
  const id = IdSchema.parse(formData.get('id'));

  const [current] = await db
    .select({ isAvailable: schema.modifiers.isAvailable })
    .from(schema.modifiers)
    .where(and(eq(schema.modifiers.id, id), eq(schema.modifiers.groupId, group.id)));
  if (!current) return;

  await db
    .update(schema.modifiers)
    .set({ isAvailable: !current.isAvailable })
    .where(eq(schema.modifiers.id, id));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function moveModifierAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product, group } = await ensureGroupInProduct(groupId, productId);
  const id = IdSchema.parse(formData.get('id'));
  const direction = z.enum(['up', 'down']).parse(formData.get('direction'));

  const ordered = await db
    .select({ id: schema.modifiers.id, ordem: schema.modifiers.ordem })
    .from(schema.modifiers)
    .where(eq(schema.modifiers.groupId, group.id))
    .orderBy(schema.modifiers.ordem);

  const idx = ordered.findIndex((m) => m.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];

  await db
    .update(schema.modifiers)
    .set({ ordem: b.ordem })
    .where(eq(schema.modifiers.id, a.id));
  await db
    .update(schema.modifiers)
    .set({ ordem: a.ordem })
    .where(eq(schema.modifiers.id, b.id));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function deleteModifierAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const groupId = IdSchema.parse(formData.get('groupId'));
  const { product, group } = await ensureGroupInProduct(groupId, productId);
  const id = IdSchema.parse(formData.get('id'));

  await db
    .delete(schema.modifiers)
    .where(and(eq(schema.modifiers.id, id), eq(schema.modifiers.groupId, group.id)));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}
