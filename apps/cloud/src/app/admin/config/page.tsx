import { eq } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { ConfigForm } from './ConfigForm';

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

      <ConfigForm
        initial={{
          nome: t.nome,
          brand: t.brand,
          area: t.area,
          sinceLabel: t.sinceLabel,
          heroImageUrl: t.heroImageUrl,
          wifiSsid: t.wifiSsid,
          wifiPass: t.wifiPass,
        }}
      />
    </div>
  );
}
