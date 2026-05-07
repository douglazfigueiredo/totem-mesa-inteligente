import { eq } from 'drizzle-orm';
import { cloudLink } from '../db/schema.js';
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
