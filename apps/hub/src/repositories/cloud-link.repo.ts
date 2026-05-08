import { eq } from 'drizzle-orm';
import { cloudLink, tenants } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';

export type CloudLink = typeof cloudLink.$inferSelect;
export type NewCloudLink = Omit<typeof cloudLink.$inferInsert, 'id' | 'pairedAt'>;

const SINGLETON_ID = 'singleton';

export const makeCloudLinkRepo = (db: DBClient, clock: Clock) => ({
  get(): CloudLink | null {
    const row = db.select().from(cloudLink).where(eq(cloudLink.id, SINGLETON_ID)).get();
    return row ?? null;
  },

  set(link: NewCloudLink): CloudLink {
    const now = clock.now();
    const values = { ...link, id: SINGLETON_ID, pairedAt: now };

    // Espelha o tenant do cloud na tabela local pra que catálogo,
    // mesas e funcionários (que usam tenant_id como FK) possam ser
    // sincronizados sem violar foreign keys. O tenantId local original
    // do bootstrap fica intocado — só adicionamos um novo "tenant
    // espelho" com o ID que o cloud espera.
    const existingTenant = db
      .select()
      .from(tenants)
      .where(eq(tenants.id, link.tenantId))
      .get();
    if (!existingTenant) {
      db.insert(tenants)
        .values({
          id: link.tenantId,
          slug: `cloud-${link.tenantId.slice(0, 8)}`,
          nome: link.tenantNome,
          vertical: 'pizzaria',
          features: {
            mesas: true,
            comanda: false,
            balcao: false,
            retirada: false,
            delivery: false,
            pizzaMetade: false,
            combo: false,
          },
          timezone: 'America/Sao_Paulo',
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }

    db.insert(cloudLink)
      .values(values)
      .onConflictDoUpdate({
        target: cloudLink.id,
        set: {
          cloudBaseUrl: link.cloudBaseUrl,
          tenantId: link.tenantId,
          tenantNome: link.tenantNome,
          hubId: link.hubId,
          hubNome: link.hubNome,
          apiKey: link.apiKey,
          pairedAt: now,
          lastSyncAt: null,
          lastSyncVersion: null,
        },
      })
      .run();
    return db.select().from(cloudLink).where(eq(cloudLink.id, SINGLETON_ID)).get()!;
  },

  markSynced(version: number): void {
    db.update(cloudLink)
      .set({ lastSyncAt: clock.now(), lastSyncVersion: version })
      .where(eq(cloudLink.id, SINGLETON_ID))
      .run();
  },

  clear(): void {
    db.delete(cloudLink).where(eq(cloudLink.id, SINGLETON_ID)).run();
  },
});

export type CloudLinkRepo = ReturnType<typeof makeCloudLinkRepo>;
