'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, max, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';

const IdSchema = z.string().uuid();
const NomeSchema = z.string().trim().min(1).max(60);
const PriceSchema = z.coerce.number().int().min(0).max(10_000_000);

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

export async function createVariantAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);

  const nome = NomeSchema.parse(formData.get('nome'));
  const reais = String(formData.get('priceReais') ?? '0').replace(',', '.');
  const priceCents = PriceSchema.parse(Math.round(parseFloat(reais || '0') * 100));

  const [{ maxOrdem }] = await db
    .select({ maxOrdem: max(schema.productVariants.ordem) })
    .from(schema.productVariants)
    .where(eq(schema.productVariants.productId, product.id));

  await db.insert(schema.productVariants).values({
    productId: product.id,
    nome,
    priceCents,
    ordem: (maxOrdem ?? -1) + 1,
  });

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function updateVariantAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);
  const id = IdSchema.parse(formData.get('id'));

  const nome = NomeSchema.parse(formData.get('nome'));
  const reais = String(formData.get('priceReais') ?? '0').replace(',', '.');
  const priceCents = PriceSchema.parse(Math.round(parseFloat(reais || '0') * 100));

  await db
    .update(schema.productVariants)
    .set({ nome, priceCents })
    .where(
      and(
        eq(schema.productVariants.id, id),
        eq(schema.productVariants.productId, product.id),
      ),
    );

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function setDefaultVariantAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);
  const id = IdSchema.parse(formData.get('id'));

  // remove default das outras (sem unique constraint, ok com 2 updates)
  await db
    .update(schema.productVariants)
    .set({ isDefault: false })
    .where(
      and(
        eq(schema.productVariants.productId, product.id),
        ne(schema.productVariants.id, id),
      ),
    );
  await db
    .update(schema.productVariants)
    .set({ isDefault: true })
    .where(
      and(
        eq(schema.productVariants.id, id),
        eq(schema.productVariants.productId, product.id),
      ),
    );

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function toggleVariantAvailableAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);
  const id = IdSchema.parse(formData.get('id'));

  const [current] = await db
    .select({ isAvailable: schema.productVariants.isAvailable })
    .from(schema.productVariants)
    .where(
      and(
        eq(schema.productVariants.id, id),
        eq(schema.productVariants.productId, product.id),
      ),
    );
  if (!current) return;

  await db
    .update(schema.productVariants)
    .set({ isAvailable: !current.isAvailable })
    .where(eq(schema.productVariants.id, id));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function moveVariantAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);
  const id = IdSchema.parse(formData.get('id'));
  const direction = z.enum(['up', 'down']).parse(formData.get('direction'));

  const ordered = await db
    .select({ id: schema.productVariants.id, ordem: schema.productVariants.ordem })
    .from(schema.productVariants)
    .where(eq(schema.productVariants.productId, product.id))
    .orderBy(schema.productVariants.ordem);

  const idx = ordered.findIndex((v) => v.id === id);
  if (idx === -1) return;
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= ordered.length) return;

  const a = ordered[idx];
  const b = ordered[swapIdx];

  await db
    .update(schema.productVariants)
    .set({ ordem: b.ordem })
    .where(eq(schema.productVariants.id, a.id));
  await db
    .update(schema.productVariants)
    .set({ ordem: a.ordem })
    .where(eq(schema.productVariants.id, b.id));

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}

export async function deleteVariantAction(formData: FormData) {
  const productId = IdSchema.parse(formData.get('productId'));
  const product = await ensureProductInTenant(productId);
  const id = IdSchema.parse(formData.get('id'));

  await db
    .delete(schema.productVariants)
    .where(
      and(
        eq(schema.productVariants.id, id),
        eq(schema.productVariants.productId, product.id),
      ),
    );

  revalidatePath(`/admin/cardapio/${product.categoryId}`);
}
