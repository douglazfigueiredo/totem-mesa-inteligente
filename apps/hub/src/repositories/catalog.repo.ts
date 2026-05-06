import { eq } from 'drizzle-orm';
import { catalogSnapshots } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { CatalogSnapshot, type TenantId } from '@app/schemas';

export const makeCatalogRepo = (db: DBClient, clock: Clock) => ({
  getSnapshot(tenantId: TenantId): CatalogSnapshot | null {
    const row = db
      .select()
      .from(catalogSnapshots)
      .where(eq(catalogSnapshots.tenantId, tenantId))
      .get();
    return row ? CatalogSnapshot.parse(row.data) : null;
  },

  getVersion(tenantId: TenantId): number | null {
    const row = db
      .select({ version: catalogSnapshots.version })
      .from(catalogSnapshots)
      .where(eq(catalogSnapshots.tenantId, tenantId))
      .get();
    return row?.version ?? null;
  },

  replace(snapshot: CatalogSnapshot): CatalogSnapshot {
    const validated = CatalogSnapshot.parse(snapshot);
    db.insert(catalogSnapshots)
      .values({
        tenantId: validated.tenantId,
        version: validated.version,
        data: validated,
        pulledAt: clock.now(),
      })
      .onConflictDoUpdate({
        target: catalogSnapshots.tenantId,
        set: {
          version: validated.version,
          data: validated,
          pulledAt: clock.now(),
        },
      })
      .run();
    return validated;
  },
});

export type CatalogRepo = ReturnType<typeof makeCatalogRepo>;
