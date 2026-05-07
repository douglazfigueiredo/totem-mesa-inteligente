import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import {
  createProductAction,
  updateProductAction,
  toggleProductAvailableAction,
  moveProductAction,
  deleteProductAction,
} from './actions';
import {
  createVariantAction,
  updateVariantAction,
  setDefaultVariantAction,
  toggleVariantAvailableAction,
  moveVariantAction,
  deleteVariantAction,
} from './variant-actions';
import {
  createGroupAction,
  updateGroupAction,
  moveGroupAction,
  deleteGroupAction,
  createModifierAction,
  updateModifierAction,
  toggleModifierAvailableAction,
  moveModifierAction,
  deleteModifierAction,
} from './modifier-actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ categoryId: string }>;

type Variant = typeof schema.productVariants.$inferSelect;
type Group = typeof schema.modifierGroups.$inferSelect;
type Modifier = typeof schema.modifiers.$inferSelect;
type Product = typeof schema.products.$inferSelect;
type EnrichedProduct = Product & {
  variants: Variant[];
  groups: (Group & { modifiers: Modifier[] })[];
};

export default async function CategoryProductsPage({ params }: { params: Params }) {
  const { categoryId } = await params;
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const [category] = await db
    .select()
    .from(schema.categories)
    .where(and(eq(schema.categories.id, categoryId), eq(schema.categories.tenantId, tenant.id)));
  if (!category) notFound();

  const productsRows = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.categoryId, category.id))
    .orderBy(schema.products.ordem);

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

  const modifiersByGroup = new Map<string, Modifier[]>();
  for (const m of modifiersRows) {
    const arr = modifiersByGroup.get(m.groupId) ?? [];
    arr.push(m);
    modifiersByGroup.set(m.groupId, arr);
  }

  const groupsByProduct = new Map<string, (Group & { modifiers: Modifier[] })[]>();
  for (const g of groupsRows) {
    const arr = groupsByProduct.get(g.productId) ?? [];
    arr.push({ ...g, modifiers: modifiersByGroup.get(g.id) ?? [] });
    groupsByProduct.set(g.productId, arr);
  }

  const variantsByProduct = new Map<string, Variant[]>();
  for (const v of variantsRows) {
    const arr = variantsByProduct.get(v.productId) ?? [];
    arr.push(v);
    variantsByProduct.set(v.productId, arr);
  }

  const products: EnrichedProduct[] = productsRows.map((p) => ({
    ...p,
    variants: variantsByProduct.get(p.id) ?? [],
    groups: groupsByProduct.get(p.id) ?? [],
  }));

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <Link
          href="/admin/cardapio"
          className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:text-[var(--color-ink)]"
        >
          ← cardápio
        </Link>
        <h1
          className="mt-1 text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">{category.nome.toLowerCase()}</em>
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          produtos da categoria. expanda um item pra editar detalhes, variantes e modificadores.
        </p>
      </div>

      <form
        action={createProductAction}
        className="flex flex-wrap gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[var(--shadow-card)]"
      >
        <input type="hidden" name="categoryId" value={category.id} />
        <input
          name="nome"
          required
          maxLength={120}
          placeholder="nome do produto…"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
        <input
          name="basePriceCents"
          required
          inputMode="decimal"
          placeholder="preço (R$)"
          className="w-28 rounded-lg border border-[var(--color-line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-deep)]"
        >
          + adicionar
        </button>
      </form>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-8 text-center text-sm text-[var(--color-ink-soft)]">
          <p className="mono mb-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            sem produtos
          </p>
          comece adicionando um produto acima.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {products.map((p, idx) => (
            <ProductRow
              key={p.id}
              product={p}
              categoryId={category.id}
              isFirst={idx === 0}
              isLast={idx === products.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function ProductRow({
  product,
  categoryId,
  isFirst,
  isLast,
}: {
  product: EnrichedProduct;
  categoryId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li
      className={`overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] shadow-[var(--shadow-card)] transition ${
        product.isAvailable ? '' : 'opacity-60'
      }`}
    >
      <div className="flex items-center gap-3 border-b border-[var(--color-line)] p-3">
        <div className="flex flex-col">
          <form action={moveProductAction}>
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              aria-label="mover pra cima"
              className="flex h-5 w-5 items-center justify-center rounded text-xs text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ▲
            </button>
          </form>
          <form action={moveProductAction}>
            <input type="hidden" name="categoryId" value={categoryId} />
            <input type="hidden" name="id" value={product.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              aria-label="mover pra baixo"
              className="flex h-5 w-5 items-center justify-center rounded text-xs text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:hover:bg-transparent"
            >
              ▼
            </button>
          </form>
        </div>

        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-soft)] text-[10px] text-[var(--color-ink-mute)]">
            sem foto
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{product.nome}</p>
          <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            {formatBRL(product.basePriceCents)} · {product.destino}
            {product.tempoEstimadoSec > 0 && ` · ${Math.round(product.tempoEstimadoSec / 60)}min`}
            {product.variants.length > 0 && ` · ${product.variants.length} var`}
            {product.groups.length > 0 && ` · ${product.groups.length} grp`}
          </p>
        </div>

        <form action={toggleProductAvailableAction}>
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
          >
            {product.isAvailable ? 'pausar' : 'ativar'}
          </button>
        </form>

        <form action={deleteProductAction}>
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="id" value={product.id} />
          <button
            type="submit"
            aria-label="excluir"
            className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
          >
            excluir
          </button>
        </form>
      </div>

      <details className="group border-b border-[var(--color-line)] last:border-b-0">
        <summary className="mono cursor-pointer list-none px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-soft)]">
          ▸ editar detalhes
        </summary>
        <ProductEditForm product={product} categoryId={categoryId} />
      </details>

      <details className="group border-b border-[var(--color-line)] last:border-b-0">
        <summary className="mono cursor-pointer list-none px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-soft)]">
          ▸ variantes ({product.variants.length})
        </summary>
        <VariantsSection product={product} />
      </details>

      <details className="group">
        <summary className="mono cursor-pointer list-none px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-soft)]">
          ▸ modificadores ({product.groups.length} grupo
          {product.groups.length === 1 ? '' : 's'})
        </summary>
        <ModifiersSection product={product} />
      </details>
    </li>
  );
}

const inputCls =
  'w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20';

const inputSmCls =
  'rounded-md border border-[var(--color-line)] bg-white px-2 py-1 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20';

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'md:col-span-2' : ''}`}>
      <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-[var(--color-line)]"
      />
      {label}
    </label>
  );
}

function ProductEditForm({
  product,
  categoryId,
}: {
  product: EnrichedProduct;
  categoryId: string;
}) {
  return (
    <form action={updateProductAction} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="id" value={product.id} />
      <Field label="nome">
        <input name="nome" defaultValue={product.nome} required maxLength={120} className={inputCls} />
      </Field>
      <Field label={product.variants.length > 0 ? 'preço base (fallback)' : 'preço (R$)'}>
        <input
          name="basePriceReais"
          defaultValue={(product.basePriceCents / 100).toFixed(2)}
          required
          inputMode="decimal"
          className={inputCls}
        />
      </Field>
      <Field label="descrição" full>
        <textarea
          name="descricao"
          defaultValue={product.descricao ?? ''}
          maxLength={500}
          rows={2}
          className={`${inputCls} resize-y`}
        />
      </Field>
      <Field label="url da foto" full>
        <input
          name="imageUrl"
          defaultValue={product.imageUrl ?? ''}
          type="url"
          maxLength={2000}
          placeholder="https://…"
          className={inputCls}
        />
      </Field>
      <Field label="destino">
        <select name="destino" defaultValue={product.destino} className={inputCls}>
          <option value="cozinha">cozinha (KDS)</option>
          <option value="garcom">garçom (entrega direta)</option>
        </select>
      </Field>
      <Field label="tempo estimado (seg)">
        <input
          name="tempoEstimadoSec"
          defaultValue={product.tempoEstimadoSec}
          type="number"
          min={0}
          max={7200}
          className={inputCls}
        />
      </Field>
      <div className="col-span-full flex flex-wrap gap-4">
        <Checkbox name="isVegetarian" defaultChecked={product.isVegetarian} label="vegetariano" />
        <Checkbox name="isGlutenFree" defaultChecked={product.isGlutenFree} label="sem glúten" />
      </div>
      <div className="col-span-full flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          salvar alterações
        </button>
      </div>
    </form>
  );
}

/* ── Variants ─────────────────────────────────────────────────────── */

function VariantsSection({ product }: { product: EnrichedProduct }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs text-[var(--color-ink-soft)]">
        variações (P/M/G, 350ml/600ml…). quando o produto tem variantes, o totem força o cliente a escolher uma — o preço base vira fallback.
      </p>
      <form action={createVariantAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="productId" value={product.id} />
        <input
          name="nome"
          required
          maxLength={60}
          placeholder="nome da variante…"
          className={`${inputSmCls} min-w-0 flex-1`}
        />
        <input
          name="priceReais"
          required
          inputMode="decimal"
          placeholder="preço (R$)"
          className={`${inputSmCls} w-24`}
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-deep)]"
        >
          + variante
        </button>
      </form>

      {product.variants.length === 0 ? (
        <p className="mono py-2 text-center text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          sem variantes — produto vendido pelo preço base
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {product.variants.map((v, idx) => (
            <VariantRow
              key={v.id}
              variant={v}
              productId={product.id}
              isFirst={idx === 0}
              isLast={idx === product.variants.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function VariantRow({
  variant,
  productId,
  isFirst,
  isLast,
}: {
  variant: Variant;
  productId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-md border border-[var(--color-line)] bg-white p-2 ${
        variant.isAvailable ? '' : 'opacity-60'
      }`}
    >
      <div className="flex flex-col">
        <form action={moveVariantAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={isFirst}
            className="flex h-4 w-4 items-center justify-center text-[10px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] disabled:opacity-30"
          >
            ▲
          </button>
        </form>
        <form action={moveVariantAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            className="flex h-4 w-4 items-center justify-center text-[10px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] disabled:opacity-30"
          >
            ▼
          </button>
        </form>
      </div>

      <form action={updateVariantAction} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="id" value={variant.id} />
        <input
          name="nome"
          defaultValue={variant.nome}
          required
          maxLength={60}
          className={`${inputSmCls} flex-1`}
        />
        <input
          name="priceReais"
          defaultValue={(variant.priceCents / 100).toFixed(2)}
          required
          inputMode="decimal"
          className={`${inputSmCls} w-20`}
        />
        <button
          type="submit"
          className="mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          salvar
        </button>
      </form>

      {variant.isDefault ? (
        <span className="mono rounded bg-[var(--color-warm)] px-2 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink)]">
          padrão
        </span>
      ) : (
        <form action={setDefaultVariantAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="id" value={variant.id} />
          <button
            type="submit"
            className="mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
          >
            tornar padrão
          </button>
        </form>
      )}

      <form action={toggleVariantAvailableAction}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="id" value={variant.id} />
        <button
          type="submit"
          className="mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          {variant.isAvailable ? 'pausar' : 'ativar'}
        </button>
      </form>

      <form action={deleteVariantAction}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="id" value={variant.id} />
        <button
          type="submit"
          className="mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
        >
          excluir
        </button>
      </form>
    </li>
  );
}

/* ── Modifiers ────────────────────────────────────────────────────── */

function ModifiersSection({ product }: { product: EnrichedProduct }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <p className="text-xs text-[var(--color-ink-soft)]">
        grupos de modificadores: ex. &quot;escolha 2 sabores&quot; (multi, min/max=2), &quot;adicionais&quot; (multi, opcional), &quot;borda&quot; (single).
      </p>
      <form action={createGroupAction} className="flex flex-wrap gap-2">
        <input type="hidden" name="productId" value={product.id} />
        <input
          name="nome"
          required
          maxLength={80}
          placeholder="nome do grupo (ex: adicionais)…"
          className={`${inputSmCls} min-w-0 flex-1`}
        />
        <button
          type="submit"
          className="rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs font-semibold text-white hover:bg-[var(--color-accent-deep)]"
        >
          + grupo
        </button>
      </form>

      {product.groups.length === 0 ? (
        <p className="mono py-2 text-center text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          sem grupos de modificadores
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {product.groups.map((g, idx) => (
            <GroupCard
              key={g.id}
              group={g}
              productId={product.id}
              isFirst={idx === 0}
              isLast={idx === product.groups.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function GroupCard({
  group,
  productId,
  isFirst,
  isLast,
}: {
  group: Group & { modifiers: Modifier[] };
  productId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li className="rounded-lg border border-[var(--color-line)] bg-[var(--color-soft)]">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] p-2">
        <div className="flex flex-col">
          <form action={moveGroupAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="groupId" value={group.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              className="flex h-4 w-4 items-center justify-center text-[10px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] disabled:opacity-30"
            >
              ▲
            </button>
          </form>
          <form action={moveGroupAction}>
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="groupId" value={group.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              className="flex h-4 w-4 items-center justify-center text-[10px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] disabled:opacity-30"
            >
              ▼
            </button>
          </form>
        </div>

        <p className="flex-1 text-sm font-semibold">{group.nome}</p>
        <span className="mono rounded bg-white px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          {group.selectionType === 'single' ? 'escolha 1' : 'múltipla'}
          {group.required && ' · obrig.'}
          {group.minSelect > 0 && ` · min ${group.minSelect}`}
          {group.maxSelect != null && ` · max ${group.maxSelect}`}
        </span>
        <form action={deleteGroupAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={group.id} />
          <button
            type="submit"
            className="mono rounded px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
          >
            excluir grupo
          </button>
        </form>
      </div>

      <details>
        <summary className="mono cursor-pointer list-none px-2 py-1.5 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)]">
          ▸ config do grupo
        </summary>
        <form
          action={updateGroupAction}
          className="grid grid-cols-1 gap-2 border-t border-[var(--color-line)] bg-white p-3 md:grid-cols-2"
        >
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={group.id} />
          <Field label="nome">
            <input name="nome" defaultValue={group.nome} required maxLength={80} className={inputCls} />
          </Field>
          <Field label="tipo de seleção">
            <select name="selectionType" defaultValue={group.selectionType} className={inputCls}>
              <option value="single">single (radio — escolha 1)</option>
              <option value="multi">multi (checkboxes)</option>
            </select>
          </Field>
          <Field label="mín. seleções">
            <input
              type="number"
              name="minSelect"
              defaultValue={group.minSelect}
              min={0}
              max={99}
              className={inputCls}
            />
          </Field>
          <Field label="máx. seleções (vazio = sem limite)">
            <input
              type="number"
              name="maxSelect"
              defaultValue={group.maxSelect ?? ''}
              min={0}
              max={99}
              className={inputCls}
            />
          </Field>
          <div className="col-span-full">
            <Checkbox name="required" defaultChecked={group.required} label="obrigatório" />
          </div>
          <div className="col-span-full flex justify-end">
            <button
              type="submit"
              className="rounded-md bg-[var(--color-ink)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              salvar grupo
            </button>
          </div>
        </form>
      </details>

      <div className="border-t border-[var(--color-line)] bg-white p-3">
        <form action={createModifierAction} className="mb-2 flex flex-wrap gap-2">
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={group.id} />
          <input
            name="nome"
            required
            maxLength={80}
            placeholder="nome do modificador…"
            className={`${inputSmCls} min-w-0 flex-1`}
          />
          <input
            name="priceDeltaReais"
            defaultValue="0,00"
            inputMode="decimal"
            placeholder="+ R$"
            className={`${inputSmCls} w-20`}
          />
          <button
            type="submit"
            className="mono rounded-md bg-[var(--color-warm)] px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--color-ink)] hover:opacity-90"
          >
            + item
          </button>
        </form>

        {group.modifiers.length === 0 ? (
          <p className="mono py-1 text-center text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            sem itens
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {group.modifiers.map((m, idx) => (
              <ModifierRow
                key={m.id}
                modifier={m}
                productId={productId}
                groupId={group.id}
                isFirst={idx === 0}
                isLast={idx === group.modifiers.length - 1}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function ModifierRow({
  modifier,
  productId,
  groupId,
  isFirst,
  isLast,
}: {
  modifier: Modifier;
  productId: string;
  groupId: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded border border-[var(--color-line)] bg-[var(--color-paper)] p-1.5 ${
        modifier.isAvailable ? '' : 'opacity-60'
      }`}
    >
      <div className="flex flex-col">
        <form action={moveModifierAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="id" value={modifier.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={isFirst}
            className="flex h-3 w-3 items-center justify-center text-[8px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] disabled:opacity-30"
          >
            ▲
          </button>
        </form>
        <form action={moveModifierAction}>
          <input type="hidden" name="productId" value={productId} />
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="id" value={modifier.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={isLast}
            className="flex h-3 w-3 items-center justify-center text-[8px] text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] disabled:opacity-30"
          >
            ▼
          </button>
        </form>
      </div>

      <form action={updateModifierAction} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="id" value={modifier.id} />
        <input
          name="nome"
          defaultValue={modifier.nome}
          required
          maxLength={80}
          className={`${inputSmCls} flex-1 text-xs`}
        />
        <input
          name="priceDeltaReais"
          defaultValue={(modifier.priceDeltaCents / 100).toFixed(2)}
          inputMode="decimal"
          className={`${inputSmCls} w-16 text-xs`}
        />
        <button
          type="submit"
          className="mono rounded px-1 text-[8px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          ok
        </button>
      </form>

      <form action={toggleModifierAvailableAction}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="id" value={modifier.id} />
        <button
          type="submit"
          className="mono rounded px-1 text-[8px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          {modifier.isAvailable ? 'pausar' : 'ativar'}
        </button>
      </form>

      <form action={deleteModifierAction}>
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="groupId" value={groupId} />
        <input type="hidden" name="id" value={modifier.id} />
        <button
          type="submit"
          className="mono rounded px-1 text-[8px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
        >
          x
        </button>
      </form>
    </li>
  );
}
