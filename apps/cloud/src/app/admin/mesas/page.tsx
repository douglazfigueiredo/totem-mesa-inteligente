import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { ToastForm } from '@/components/ToastForm';
import {
  createTableAction,
  updateTableAction,
  toggleTableActiveAction,
  deleteTableAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function MesasPage() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const tables = await db
    .select()
    .from(schema.tables)
    .where(eq(schema.tables.tenantId, tenant.id))
    .orderBy(schema.tables.numero);

  const activeCount = tables.filter((t) => t.isActive).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          mesas · {activeCount} ativa{activeCount === 1 ? '' : 's'}
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">mesas</em> da loja
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          cadastre cada mesa com número e capacidade. o totem de cada mesa será pareado com o id
          gerado aqui.
        </p>
      </div>

      <ToastForm
        action={createTableAction}
        className="grid grid-cols-[120px_140px_1fr] gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[var(--shadow-card)]"
      >
        <label className="flex flex-col gap-1">
          <span className="mono text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            número
          </span>
          <input
            name="numero"
            type="number"
            min={1}
            max={999}
            required
            placeholder="1"
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="mono text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            capacidade
          </span>
          <input
            name="capacidade"
            type="number"
            min={1}
            max={50}
            defaultValue={4}
            className="rounded-lg border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-deep)]"
          >
            + adicionar mesa
          </button>
        </div>
      </ToastForm>

      {tables.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-8 text-center text-sm text-[var(--color-ink-soft)]">
          <p className="mono mb-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            sem mesas cadastradas
          </p>
          adicione a primeira mesa acima.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {tables.map((t) => (
            <TableRow key={t.id} table={t} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TableRow({ table }: { table: typeof schema.tables.$inferSelect }) {
  return (
    <li
      className={`group flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-card)] transition ${
        table.isActive ? '' : 'opacity-50'
      }`}
    >
      <div
        className="mono flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-soft)] text-base font-bold text-[var(--color-ink)]"
        title="número"
      >
        {String(table.numero).padStart(2, '0')}
      </div>

      <ToastForm action={updateTableAction} className="flex flex-1 items-center gap-2">
        <input type="hidden" name="id" value={table.id} />
        <label className="flex flex-1 flex-col gap-0.5">
          <span className="mono text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            número
          </span>
          <input
            name="numero"
            type="number"
            min={1}
            max={999}
            defaultValue={table.numero}
            required
            className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm hover:border-[var(--color-line)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none"
          />
        </label>
        <label className="flex flex-1 flex-col gap-0.5">
          <span className="mono text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            capacidade
          </span>
          <input
            name="capacidade"
            type="number"
            min={1}
            max={50}
            defaultValue={table.capacidade}
            required
            className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm hover:border-[var(--color-line)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="mono rounded px-2 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          salvar
        </button>
      </ToastForm>

      <ToastForm action={toggleTableActiveAction}>
        <input type="hidden" name="id" value={table.id} />
        <button
          type="submit"
          className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
        >
          {table.isActive ? 'desativar' : 'ativar'}
        </button>
      </ToastForm>

      <ToastForm action={deleteTableAction}>
        <input type="hidden" name="id" value={table.id} />
        <button
          type="submit"
          aria-label="excluir"
          className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
        >
          excluir
        </button>
      </ToastForm>
    </li>
  );
}
