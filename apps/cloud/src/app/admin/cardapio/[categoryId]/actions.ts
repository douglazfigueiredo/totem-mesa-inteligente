'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { withFeedback, type ActionState } from '@/lib/actions';

const IdSchema = z.string().uuid();

const PriceCentsSchema = z.coerce.number().int().min(0).max(10_000_000);
const NomeSchema = z.string().trim().min(1).max(120);
const DescricaoSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v.length === 0 ? null : v));
const UrlOrEmpty = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v.length === 0 || /^https?:\/\//i.test(v), 'URL inválida')
  .transform((v) => (v.length === 0 ? null : v));
const DestinoSchema = z.enum(['cozinha', 'garcom']);
const TempoSchema = z.coerce.number().int().min(0).max(7200);

async function ctx(categoryId: string) {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) throw new Error('sem tenant ativo');

  const [cat] = await db
    .select()
    .from(schema.categories)
    .where(
      and(eq(schema.categories.id, categoryId), eq(schema.categories.tenantId, tenant.id)),
    );
  if (!cat) throw new Error('categoria não encontrada');
  return { tenant, category: cat };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('produto criado', async () => {
    const categoryId = IdSchema.parse(formData.get('categoryId'));
    const { tenant, category } = await ctx(categoryId);

    const nome = NomeSchema.parse(formData.get('nome'));
    const reaisOrCents = String(formData.get('basePriceCents') ?? '0').replace(',', '.');
    const basePriceCents = PriceCentsSchema.parse(
      Math.round(parseFloat(reaisOrCents || '0') * 100),
    );

    const [{ maxOrdem }] = await db
      .select({ maxOrdem: max(schema.products.ordem) })
      .from(schema.products)
      .where(eq(schema.products.categoryId, category.id));

    await db.insert(schema.products).values({
      tenantId: tenant.id,
      categoryId: category.id,
      nome,
      basePriceCents,
      ordem: (maxOrdem ?? -1) + 1,
    });

    revalidatePath(`/admin/cardapio/${category.id}`);
    revalidatePath('/admin/cardapio');
  });
}

export async function updateProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('produto atualizado', async () => {
    const categoryId = IdSchema.parse(formData.get('categoryId'));
    const { tenant, category } = await ctx(categoryId);
    const id = IdSchema.parse(formData.get('id'));

    const nome = NomeSchema.parse(formData.get('nome'));
    const descricao = DescricaoSchema.parse(formData.get('descricao') ?? '');
    const imageUrl = UrlOrEmpty.parse(formData.get('imageUrl') ?? '');
    const reais = String(formData.get('basePriceReais') ?? '0').replace(',', '.');
    const basePriceCents = PriceCentsSchema.parse(Math.round(parseFloat(reais || '0') * 100));
    const destino = DestinoSchema.parse(formData.get('destino') ?? 'cozinha');
    const tempoEstimadoSec = TempoSchema.parse(formData.get('tempoEstimadoSec') ?? '0');
    const isVegetarian = formData.get('isVegetarian') === 'on';
    const isGlutenFree = formData.get('isGlutenFree') === 'on';

    await db
      .update(schema.products)
      .set({
        nome,
        descricao,
        imageUrl,
        basePriceCents,
        destino,
        tempoEstimadoSec,
        isVegetarian,
        isGlutenFree,
        updatedAt: new Date(),
      })
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)));

    revalidatePath(`/admin/cardapio/${category.id}`);
  });
}

export async function toggleProductAvailableAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('', async () => {
    const categoryId = IdSchema.parse(formData.get('categoryId'));
    const { tenant, category } = await ctx(categoryId);
    const id = IdSchema.parse(formData.get('id'));

    const [current] = await db
      .select({ isAvailable: schema.products.isAvailable })
      .from(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)));
    if (!current) return;

    await db
      .update(schema.products)
      .set({ isAvailable: !current.isAvailable, updatedAt: new Date() })
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)));

    revalidatePath(`/admin/cardapio/${category.id}`);
  });
}

export async function moveProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('', async () => {
    const categoryId = IdSchema.parse(formData.get('categoryId'));
    const { category } = await ctx(categoryId);
    const id = IdSchema.parse(formData.get('id'));
    const direction = z.enum(['up', 'down']).parse(formData.get('direction'));

    const ordered = await db
      .select({ id: schema.products.id, ordem: schema.products.ordem })
      .from(schema.products)
      .where(eq(schema.products.categoryId, category.id))
      .orderBy(schema.products.ordem);

    const idx = ordered.findIndex((p) => p.id === id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ordered.length) return;

    const a = ordered[idx];
    const b = ordered[swapIdx];

    await db
      .update(schema.products)
      .set({ ordem: b.ordem, updatedAt: new Date() })
      .where(eq(schema.products.id, a.id));
    await db
      .update(schema.products)
      .set({ ordem: a.ordem, updatedAt: new Date() })
      .where(eq(schema.products.id, b.id));

    revalidatePath(`/admin/cardapio/${category.id}`);
  });
}

export async function deleteProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return withFeedback('produto removido', async () => {
    const categoryId = IdSchema.parse(formData.get('categoryId'));
    const { tenant, category } = await ctx(categoryId);
    const id = IdSchema.parse(formData.get('id'));

    await db
      .delete(schema.products)
      .where(and(eq(schema.products.id, id), eq(schema.products.tenantId, tenant.id)));

    revalidatePath(`/admin/cardapio/${category.id}`);
    revalidatePath('/admin/cardapio');
  });
}
