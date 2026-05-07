import { eq } from 'drizzle-orm';
import { tenantConfig } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import type { TenantConfig } from '@app/schemas';

const SINGLETON_ID = 'singleton';

export type TenantConfigRow = typeof tenantConfig.$inferSelect;

export const makeTenantConfigRepo = (db: DBClient, clock: Clock) => ({
  get(): TenantConfigRow | null {
    const row = db.select().from(tenantConfig).where(eq(tenantConfig.id, SINGLETON_ID)).get();
    return row ?? null;
  },

  /**
   * Retorna a config no formato `TenantConfig` (TimestampMs em updatedAt)
   * pronto pra serializar pro totem.
   */
  asPublic(): TenantConfig | null {
    const row = this.get();
    if (!row) return null;
    return {
      tenantId: row.tenantId as TenantConfig['tenantId'],
      nome: row.nome,
      brand: row.brand,
      area: row.area,
      sinceLabel: row.sinceLabel,
      heroImageUrl: row.heroImageUrl,
      wifiSsid: row.wifiSsid,
      wifiPass: row.wifiPass,
      updatedAt: row.updatedAt,
    };
  },

  replace(cfg: TenantConfig): TenantConfigRow {
    const now = clock.now();
    const values = {
      id: SINGLETON_ID,
      tenantId: cfg.tenantId,
      nome: cfg.nome,
      brand: cfg.brand ?? null,
      area: cfg.area ?? null,
      sinceLabel: cfg.sinceLabel ?? null,
      heroImageUrl: cfg.heroImageUrl ?? null,
      wifiSsid: cfg.wifiSsid ?? null,
      wifiPass: cfg.wifiPass ?? null,
      updatedAt: cfg.updatedAt,
      syncedAt: now,
    };
    db.insert(tenantConfig)
      .values(values)
      .onConflictDoUpdate({
        target: tenantConfig.id,
        set: {
          tenantId: values.tenantId,
          nome: values.nome,
          brand: values.brand,
          area: values.area,
          sinceLabel: values.sinceLabel,
          heroImageUrl: values.heroImageUrl,
          wifiSsid: values.wifiSsid,
          wifiPass: values.wifiPass,
          updatedAt: values.updatedAt,
          syncedAt: now,
        },
      })
      .run();
    return db.select().from(tenantConfig).where(eq(tenantConfig.id, SINGLETON_ID)).get()!;
  },

  clear(): void {
    db.delete(tenantConfig).where(eq(tenantConfig.id, SINGLETON_ID)).run();
  },
});

export type TenantConfigRepo = ReturnType<typeof makeTenantConfigRepo>;
