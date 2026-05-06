import { asc, eq } from 'drizzle-orm';
import { tables } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { Table, type TableId, type TenantId } from '@app/schemas';

export const makeTableRepo = (db: DBClient, _clock: Clock) => ({
  list(tenantId: TenantId): Table[] {
    const rows = db
      .select()
      .from(tables)
      .where(eq(tables.tenantId, tenantId))
      .orderBy(asc(tables.numero))
      .all();
    return rows.map((r) =>
      Table.parse({
        ...r,
        sessionStartedAt: r.sessionStartedAt ?? undefined,
      }),
    );
  },

  getById(id: TableId): Table | null {
    const row = db.select().from(tables).where(eq(tables.id, id)).get();
    if (!row) return null;
    return Table.parse({ ...row, sessionStartedAt: row.sessionStartedAt ?? undefined });
  },
});

export type TableRepo = ReturnType<typeof makeTableRepo>;
