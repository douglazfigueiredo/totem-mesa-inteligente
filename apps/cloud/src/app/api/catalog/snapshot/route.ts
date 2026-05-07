import { NextResponse } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { CatalogSnapshot } from '@app/schemas';
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

  const tenantId = hub.tenantId;

  // Atualiza last_seen_at em paralelo com as queries (fire-and-forget)
  const lastSeenPromise = db
    .update(schema.hubs)
    .set({ lastSeenAt: new Date() })
    .where(eq(schema.hubs.id, hub.id));

  const [categoriesRows, productsRows] = await Promise.all([
    db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.tenantId, tenantId))
      .orderBy(schema.categories.ordem),
    db
      .select()
      .from(schema.products)
      .where(eq(schema.products.tenantId, tenantId))
      .orderBy(schema.products.ordem),
  ]);

  const productIds = productsRows.map((p) => p.id);

  const [variantsRows, groupsRows] = await Promise.all([
    productIds.length === 0
      ? Promise.resolve([])
      : db
          .select()
          .from(schema.productVariants)
          .where(inArray(schema.productVariants.productId, productIds))
          .orderBy(schema.productVariants.ordem),
    productIds.length === 0
      ? Promise.resolve([])
      : db
          .select()
          .from(schema.modifierGroups)
          .where(inArray(schema.modifierGroups.productId, productIds))
          .orderBy(schema.modifierGroups.ordem),
  ]);

  const groupIds = groupsRows.map((g) => g.id);
  const modifiersRows =
    groupIds.length === 0
      ? []
      : await db
          .select()
          .from(schema.modifiers)
          .where(inArray(schema.modifiers.groupId, groupIds))
          .orderBy(schema.modifiers.ordem);

  const modifiersByGroup = new Map<string, typeof modifiersRows>();
  for (const m of modifiersRows) {
    const arr = modifiersByGroup.get(m.groupId) ?? [];
    arr.push(m);
    modifiersByGroup.set(m.groupId, arr);
  }

  const groupsByProduct = new Map<string, typeof groupsRows>();
  for (const g of groupsRows) {
    const arr = groupsByProduct.get(g.productId) ?? [];
    arr.push(g);
    groupsByProduct.set(g.productId, arr);
  }

  const variantsByProduct = new Map<string, typeof variantsRows>();
  for (const v of variantsRows) {
    const arr = variantsByProduct.get(v.productId) ?? [];
    arr.push(v);
    variantsByProduct.set(v.productId, arr);
  }

  const generatedAt = Date.now();

  const snapshot = {
    tenantId,
    version: generatedAt,
    generatedAt,
    categories: categoriesRows.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      nome: c.nome,
      ordem: c.ordem,
      isActive: c.isActive,
    })),
    products: productsRows.map((p) => {
      const variants = (variantsByProduct.get(p.id) ?? []).map((v) => ({
        id: v.id,
        productId: v.productId,
        nome: v.nome,
        priceCents: v.priceCents,
        isDefault: v.isDefault,
        isAvailable: v.isAvailable,
        ordem: v.ordem,
      }));
      const modifierGroups = (groupsByProduct.get(p.id) ?? []).map((g) => ({
        id: g.id,
        productId: g.productId,
        nome: g.nome,
        selectionType: g.selectionType as 'single' | 'multi',
        required: g.required,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect ?? undefined,
        ordem: g.ordem,
        modifiers: (modifiersByGroup.get(g.id) ?? []).map((m) => ({
          id: m.id,
          groupId: m.groupId,
          nome: m.nome,
          priceDeltaCents: m.priceDeltaCents,
          isAvailable: m.isAvailable,
          ordem: m.ordem,
        })),
      }));

      return {
        id: p.id,
        tenantId: p.tenantId,
        categoryId: p.categoryId,
        nome: p.nome,
        descricao: p.descricao ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        basePriceCents: p.basePriceCents,
        destino: p.destino as 'cozinha' | 'garcom',
        tempoEstimadoSec: p.tempoEstimadoSec,
        isAvailable: p.isAvailable,
        isVegetarian: p.isVegetarian,
        isGlutenFree: p.isGlutenFree,
        variants,
        modifierGroups,
        createdAt: p.createdAt.getTime(),
        updatedAt: p.updatedAt.getTime(),
      };
    }),
  };

  // Sanity check com o schema canônico — garante que mudanças no
  // shape do cloud não corrompem o que o hub espera.
  const parsed = CatalogSnapshot.safeParse(snapshot);
  if (!parsed.success) {
    console.error('[snapshot] validação falhou', parsed.error.issues);
    return NextResponse.json(
      { error: 'snapshot inválido', issues: parsed.error.issues },
      { status: 500 },
    );
  }

  await lastSeenPromise.catch((err) => {
    console.warn('[snapshot] falha ao atualizar last_seen_at:', err);
  });

  return NextResponse.json(parsed.data, {
    headers: {
      'Cache-Control': 'no-store',
      'X-Catalog-Version': String(generatedAt),
    },
  });
}
