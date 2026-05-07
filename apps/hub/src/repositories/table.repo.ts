import { and, asc, eq } from 'drizzle-orm';
import { tables } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { Table, type TableConfig, type TableId, type TenantId } from '@app/schemas';

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

  /**
   * Lista apenas mesas ativas — usado em fluxos onde o usuário escolhe
   * uma mesa (ex: pareamento de totem). Mesas desativadas no cloud
   * continuam na tabela pra preservar FK em pedidos antigos, mas não
   * devem aparecer pra novas operações.
   */
  listActive(tenantId: TenantId): Table[] {
    const rows = db
      .select()
      .from(tables)
      .where(and(eq(tables.tenantId, tenantId), eq(tables.isActive, true)))
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

  /**
   * Sincroniza a lista de mesas vinda do cloud. Para cada TableConfig:
   * - se já existe (mesmo id), atualiza numero/capacidade/isActive
   * - se não existe, insere (status default 'livre')
   *
   * Não remove mesas locais ausentes do snapshot — FKs com orders/devices
   * impediriam o DELETE. Gerente deve desativar (isActive=false) no cloud
   * pra "remover" da operação.
   */
  upsertFromCloud(
    tenantId: TenantId,
    snapshot: TableConfig[],
  ): { inserted: number; updated: number } {
    let inserted = 0;
    let updated = 0;
    db.transaction((tx) => {
      for (const t of snapshot) {
        const existing = tx.select().from(tables).where(eq(tables.id, t.id)).get();
        if (existing) {
          tx.update(tables)
            .set({ numero: t.numero, capacidade: t.capacidade, isActive: t.isActive })
            .where(eq(tables.id, t.id))
            .run();
          updated++;
        } else {
          tx.insert(tables)
            .values({
              id: t.id,
              tenantId,
              numero: t.numero,
              capacidade: t.capacidade,
              isActive: t.isActive,
              status: 'livre',
            })
            .run();
          inserted++;
        }
      }
    });
    return { inserted, updated };
  },
});

export type TableRepo = ReturnType<typeof makeTableRepo>;
