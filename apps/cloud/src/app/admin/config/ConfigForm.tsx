'use client';

import { useFormStatus } from 'react-dom';
import { ToastForm } from '@/components/ToastForm';
import { updateTenantConfigAction } from './actions';

export type ConfigInitial = {
  nome: string;
  brand: string | null;
  area: string | null;
  sinceLabel: string | null;
  heroImageUrl: string | null;
  wifiSsid: string | null;
  wifiPass: string | null;
};

const inputCls =
  'w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20';

export function ConfigForm({ initial }: { initial: ConfigInitial }) {
  return (
    <ToastForm
      action={updateTenantConfigAction}
      className="grid grid-cols-1 gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card)] md:grid-cols-2"
    >
      <Field label="nome da loja" full>
        <input
          name="nome"
          defaultValue={initial.nome}
          required
          maxLength={120}
          className={inputCls}
        />
        <Hint>aparece em recibos, notificações, etc.</Hint>
      </Field>

      <Field label="brand (rótulo no totem)">
        <input
          name="brand"
          defaultValue={initial.brand ?? ''}
          maxLength={60}
          placeholder="ex: Pedi.Pizza"
          className={inputCls}
        />
        <Hint>fallback: o nome da loja.</Hint>
      </Field>

      <Field label="área / salão">
        <input
          name="area"
          defaultValue={initial.area ?? ''}
          maxLength={60}
          placeholder="ex: salão principal"
          className={inputCls}
        />
      </Field>

      <Field label="since label">
        <input
          name="sinceLabel"
          defaultValue={initial.sinceLabel ?? ''}
          maxLength={40}
          placeholder="ex: desde 1978"
          className={inputCls}
        />
      </Field>

      <Field label="url da imagem de hero" full>
        <input
          name="heroImageUrl"
          defaultValue={initial.heroImageUrl ?? ''}
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
          defaultValue={initial.wifiSsid ?? ''}
          maxLength={60}
          placeholder="rede aberta para clientes"
          className={inputCls}
        />
      </Field>

      <Field label="wifi · senha">
        <input
          name="wifiPass"
          defaultValue={initial.wifiPass ?? ''}
          maxLength={120}
          placeholder="opcional"
          className={inputCls}
        />
      </Field>

      <div className="col-span-full flex justify-end">
        <SubmitButton />
      </div>
    </ToastForm>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[var(--color-accent-deep)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'salvando…' : 'salvar'}
    </button>
  );
}

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
