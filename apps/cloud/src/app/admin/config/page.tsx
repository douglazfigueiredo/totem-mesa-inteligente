import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { updateTenantConfigAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function ConfigPage() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const [t] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.id, tenant.id));
  if (!t) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          config da loja
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">config</em> da loja
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          informações que aparecem no totem da mesa. mudanças são sincronizadas com o hub local
          em até 60 segundos.
        </p>
      </div>

      <form
        action={updateTenantConfigAction}
        className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card)] md:grid-cols-2"
      >
        <Field label="nome da loja" full>
          <input
            name="nome"
            defaultValue={t.nome}
            required
            maxLength={120}
            className={inputCls}
          />
          <Hint>aparece em recibos, notificações, etc.</Hint>
        </Field>

        <Field label="brand (rótulo no totem)">
          <input
            name="brand"
            defaultValue={t.brand ?? ''}
            maxLength={60}
            placeholder="ex: Pedi.Pizza"
            className={inputCls}
          />
          <Hint>fallback: o nome da loja.</Hint>
        </Field>

        <Field label="área / salão">
          <input
            name="area"
            defaultValue={t.area ?? ''}
            maxLength={60}
            placeholder="ex: salão principal"
            className={inputCls}
          />
        </Field>

        <Field label="since label">
          <input
            name="sinceLabel"
            defaultValue={t.sinceLabel ?? ''}
            maxLength={40}
            placeholder="ex: desde 1978"
            className={inputCls}
          />
        </Field>

        <Field label="url da imagem de hero" full>
          <input
            name="heroImageUrl"
            defaultValue={t.heroImageUrl ?? ''}
            type="url"
            maxLength={2000}
            placeholder="https://…"
            className={inputCls}
          />
          <Hint>foto que aparece em destaque na home do totem (formato wide).</Hint>
        </Field>

        <Field label="wifi · SSID">
          <input
            name="wifiSsid"
            defaultValue={t.wifiSsid ?? ''}
            maxLength={60}
            placeholder="rede aberta para clientes"
            className={inputCls}
          />
        </Field>

        <Field label="wifi · senha">
          <input
            name="wifiPass"
            defaultValue={t.wifiPass ?? ''}
            maxLength={120}
            placeholder="opcional"
            className={inputCls}
          />
        </Field>

        <div className="col-span-full flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--color-accent-deep)]"
          >
            salvar
          </button>
        </div>
      </form>
    </div>
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

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-[var(--color-ink-mute)]">{children}</span>;
}
