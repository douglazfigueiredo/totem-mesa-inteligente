import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import {
  createProductAction,
  updateProductAction,
  toggleProductAvailableAction,
  moveProductAction,
  deleteProductAction,
} from './actions';

export const dynamic = 'force-dynamic';

type Params = Promise<{ categoryId: string }>;

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

  const products = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.categoryId, category.id))
    .orderBy(schema.products.ordem);

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
          produtos da categoria. arraste a ordem com as setas. clique pra editar detalhes.
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
  product: typeof schema.products.$inferSelect;
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
          <img
            src={product.imageUrl}
            alt=""
            className="h-12 w-12 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-soft)] text-[10px] text-[var(--color-ink-mute)]">
            sem foto
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-semibold">{product.nome}</p>
          <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            {formatBRL(product.basePriceCents)} · {product.destino}
            {product.tempoEstimadoSec > 0 && ` · ${Math.round(product.tempoEstimadoSec / 60)}min`}
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

      <details className="group">
        <summary className="mono cursor-pointer list-none px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-soft)]">
          ▸ editar detalhes
        </summary>
        <form action={updateProductAction} className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
          <input type="hidden" name="categoryId" value={categoryId} />
          <input type="hidden" name="id" value={product.id} />

          <Field label="nome">
            <input
              name="nome"
              defaultValue={product.nome}
              required
              maxLength={120}
              className={inputCls}
            />
          </Field>
          <Field label="preço (R$)">
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
      </details>
    </li>
  );
}

const inputCls =
  'w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20';

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
