import { and, eq, gt, isNull } from 'drizzle-orm';
import { db, schema } from '@/db';
import { requireOwner } from '@/lib/tenant';
import { ToastForm } from '@/components/ToastForm';
import {
  generatePairingCodeAction,
  revokePairingCodeAction,
  unpairHubAction,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function HubsPage() {
  const owner = await requireOwner();
  const tenant = owner.activeTenant;
  if (!tenant) return null;

  const now = new Date();

  const [hubs, activeCodes] = await Promise.all([
    db
      .select()
      .from(schema.hubs)
      .where(eq(schema.hubs.tenantId, tenant.id))
      .orderBy(schema.hubs.pairedAt),
    db
      .select()
      .from(schema.hubPairings)
      .where(
        and(
          eq(schema.hubPairings.tenantId, tenant.id),
          isNull(schema.hubPairings.consumedAt),
          gt(schema.hubPairings.expiresAt, now),
        ),
      )
      .orderBy(schema.hubPairings.createdAt),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          hubs locais
        </span>
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          <em className="font-semibold italic">hubs</em> da loja
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          o hub é o mini-PC instalado na loja. ele puxa o cardápio daqui e processa pedidos
          em tempo real, sem depender da internet.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)] p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide">parear novo hub</h2>
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
            código expira em 10min
          </span>
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">
          gere um código de 6 dígitos e digite no hub local em <code>/admin/cloud/pair</code>. ele
          troca o código por uma chave permanente.
        </p>
        <ToastForm action={generatePairingCodeAction}>
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-deep)]"
          >
            gerar código
          </button>
        </ToastForm>

        {activeCodes.length > 0 && (
          <ul className="flex flex-col gap-2 pt-2">
            {activeCodes.map((c) => (
              <PairingCodeRow key={c.id} code={c} />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          hubs pareados ({hubs.length})
        </h2>
        {hubs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-soft)] p-6 text-center text-sm text-[var(--color-ink-soft)]">
            nenhum hub pareado ainda.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {hubs.map((h) => (
              <HubRow key={h.id} hub={h} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PairingCodeRow({ code }: { code: typeof schema.hubPairings.$inferSelect }) {
  const minsLeft = Math.max(0, Math.ceil((code.expiresAt.getTime() - Date.now()) / 60_000));
  return (
    <li className="flex items-center gap-3 rounded-lg border border-[var(--color-warm)] bg-[var(--color-soft)] p-3">
      <span
        className="mono text-2xl font-bold tracking-[0.4em] text-[var(--color-ink)]"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {code.code}
      </span>
      <span className="mono flex-1 text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
        expira em {minsLeft}min
      </span>
      <ToastForm action={revokePairingCodeAction}>
        <input type="hidden" name="id" value={code.id} />
        <button
          type="submit"
          className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
        >
          revogar
        </button>
      </ToastForm>
    </li>
  );
}

function HubRow({ hub }: { hub: typeof schema.hubs.$inferSelect }) {
  const lastSeen = hub.lastSeenAt;
  const status = !lastSeen
    ? 'nunca conectou'
    : Date.now() - lastSeen.getTime() < 2 * 60_000
      ? 'online'
      : `visto há ${formatRelative(lastSeen)}`;
  const isOnline = !!lastSeen && Date.now() - lastSeen.getTime() < 2 * 60_000;

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-[var(--shadow-card)]">
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${isOnline ? 'bg-[var(--color-green)]' : 'bg-[var(--color-ink-mute)]'}`}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{hub.nome}</p>
        <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-ink-mute)]">
          {status}
          {hub.version && ` · v${hub.version}`} · pareado há {formatRelative(hub.pairedAt)}
        </p>
      </div>
      <ToastForm action={unpairHubAction}>
        <input type="hidden" name="id" value={hub.id} />
        <button
          type="submit"
          className="mono rounded px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-ink-mute)] hover:bg-red-50 hover:text-red-700"
        >
          desparear
        </button>
      </ToastForm>
    </li>
  );
}

function formatRelative(date: Date) {
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'agora mesmo';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
