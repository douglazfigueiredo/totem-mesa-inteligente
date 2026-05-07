import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { ToastForm } from '@/components/ToastForm';
import {
  createEmployeeAction,
  updateEmployeeAction,
  regeneratePinAction,
  toggleEmployeeActiveAction,
  deleteEmployeeAction,
} from './actions';

export const dynamic = 'force-dynamic';

const ROLE_OPTIONS = [
  { value: 'garcom', label: 'garçom' },
  { value: 'cozinheiro', label: 'cozinheiro' },
  { value: 'caixa', label: 'caixa' },
  { value: 'gerente', label: 'gerente' },
] as const;

const ROLE_LABEL: Record<string, string> = {
  garcom: 'garçom',
  cozinheiro: 'cozinha',
  caixa: 'caixa',
  gerente: 'gerente',
};

export default async function FuncionariosPage() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const employees = await db
    .select()
    .from(schema.employees)
    .where(eq(schema.employees.tenantId, tenant.id))
    .orderBy(schema.employees.nome);

  const activeCount = employees.filter((e) => e.isActive).length;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          funcionários · {activeCount} ativo{activeCount === 1 ? '' : 's'}
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">funcionários</em> da operação
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          cadastre quem trabalha na loja. cada um recebe um PIN de 4 dígitos pra entrar no terminal
          (KDS, app garçom). o PIN é mostrado uma vez na criação — se esquecer, regere.
        </p>
      </div>

      <ToastForm
        action={createEmployeeAction}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-4 shadow-[var(--shadow-card)]"
      >
        <input
          name="nome"
          required
          maxLength={80}
          placeholder="nome do funcionário"
          className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
        />
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mono mb-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            funções
          </legend>
          {ROLE_OPTIONS.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-line)] bg-white px-3 py-1.5 text-xs has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent)]/10"
            >
              <input type="checkbox" name="roles" value={r.value} className="accent-[var(--color-accent)]" />
              <span>{r.label}</span>
            </label>
          ))}
        </fieldset>
        <button
          type="submit"
          className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-deep)]"
        >
          + adicionar funcionário
        </button>
      </ToastForm>

      {employees.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-8 text-center text-sm text-[var(--color-ink-soft)]">
          <p className="mono mb-2 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            sem funcionários cadastrados
          </p>
          adicione o primeiro acima.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {employees.map((e) => (
            <EmployeeRow key={e.id} employee={e} />
          ))}
        </ul>
      )}
    </div>
  );
}

function EmployeeRow({ employee }: { employee: typeof schema.employees.$inferSelect }) {
  const roles = employee.roles as string[];

  return (
    <li
      className={`group flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-card)] transition ${
        employee.isActive ? '' : 'opacity-50'
      }`}
    >
      <ToastForm action={updateEmployeeAction} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={employee.id} />
        <div className="flex items-center gap-2">
          <input
            name="nome"
            defaultValue={employee.nome}
            maxLength={80}
            required
            className="flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold hover:border-[var(--color-line)] focus:border-[var(--color-accent)] focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            className="mono rounded px-2 py-0.5 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
          >
            salvar
          </button>
        </div>
        <fieldset className="flex flex-wrap gap-2 pl-2">
          {ROLE_OPTIONS.map((r) => (
            <label
              key={r.value}
              className="mono flex cursor-pointer items-center gap-1.5 rounded border border-[var(--color-line)] bg-white px-2 py-0.5 text-[10px] uppercase tracking-widest has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent)]/10"
            >
              <input
                type="checkbox"
                name="roles"
                value={r.value}
                defaultChecked={roles.includes(r.value)}
                className="accent-[var(--color-accent)]"
              />
              <span>{ROLE_LABEL[r.value] ?? r.value}</span>
            </label>
          ))}
        </fieldset>
      </ToastForm>

      <div className="flex items-center justify-end gap-1 border-t border-[var(--color-line)] pt-2">
        <ToastForm action={regeneratePinAction}>
          <input type="hidden" name="id" value={employee.id} />
          <button
            type="submit"
            className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
          >
            regenerar PIN
          </button>
        </ToastForm>
        <ToastForm action={toggleEmployeeActiveAction}>
          <input type="hidden" name="id" value={employee.id} />
          <button
            type="submit"
            className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-[var(--color-warm)] hover:text-[var(--color-ink)]"
          >
            {employee.isActive ? 'desativar' : 'ativar'}
          </button>
        </ToastForm>
        <ToastForm action={deleteEmployeeAction}>
          <input type="hidden" name="id" value={employee.id} />
          <button
            type="submit"
            className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
          >
            excluir
          </button>
        </ToastForm>
      </div>
    </li>
  );
}
