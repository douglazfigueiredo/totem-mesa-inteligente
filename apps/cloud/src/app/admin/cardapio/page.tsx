import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import {
  createCategoryAction,
  renameCategoryAction,
  toggleCategoryActiveAction,
  moveCategoryAction,
  deleteCategoryAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function CardapioPage() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const categories = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.tenantId, tenant.id))
    .orderBy(schema.categories.ordem);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          cardápio · categorias
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">categorias</em> do cardápio
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          organize seu cardápio em seções. a ordem aqui aparece no totem da mesa.
        </p>
      </div>

      <form
        action={createCategoryAction}
        className="flex gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[var(--shadow-card)]"
      >
        <input
          name="nome"
          required
          maxLength={80}
          placeholder="ex: pizzas, bebidas, sobremesas…"
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-deep)]"
        >
          + adicionar
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-8 text-center text-sm text-[var(--color-ink-soft)]">
          <p className="mono mb-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            cardápio vazio
          </p>
          comece adicionando uma categoria acima.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {categories.map((cat, idx) => (
            <CategoryRow
              key={cat.id}
              cat={cat}
              isFirst={idx === 0}
              isLast={idx === categories.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({
  cat,
  isFirst,
  isLast,
}: {
  cat: typeof schema.categories.$inferSelect;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <li
      className={`group flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-card)] transition ${
        cat.isActive ? '' : 'opacity-50'
      }`}
    >
      <div className="flex flex-col">
        <form action={moveCategoryAction}>
          <input type="hidden" name="id" value={cat.id} />
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
        <form action={moveCategoryAction}>
          <input type="hidden" name="id" value={cat.id} />
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

      <form action={renameCategoryAction} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="id" value={cat.id} />
        <input
          name="nome"
          defaultValue={cat.nome}
          maxLength={80}
          required
          className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium hover:border-[var(--color-line)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          className="mono rounded px-2 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          salvar
        </button>
      </form>

      <form action={toggleCategoryActiveAction}>
        <input type="hidden" name="id" value={cat.id} />
        <button
          type="submit"
          className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          {cat.isActive ? 'desativar' : 'ativar'}
        </button>
      </form>

      <form action={deleteCategoryAction}>
        <input type="hidden" name="id" value={cat.id} />
        <button
          type="submit"
          aria-label="excluir"
          className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
        >
          excluir
        </button>
      </form>
    </li>
  );
}
