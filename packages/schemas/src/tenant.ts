import { z } from 'zod';
import { Slug, TenantId, TimestampMs } from './ids.js';
import { TenantFeatures, Vertical } from './vertical.js';

export const Tenant = z.object({
  id: TenantId,
  slug: Slug,
  nome: z.string().min(1).max(120),
  vertical: Vertical,
  features: TenantFeatures,
  timezone: z.string().default('America/Sao_Paulo'),
  createdAt: TimestampMs,
  updatedAt: TimestampMs,
});
export type Tenant = z.infer<typeof Tenant>;

/**
 * TenantConfig — opções visíveis ao cliente (totem) que o owner edita
 * no painel cloud. Substitui as envs `NEXT_PUBLIC_TENANT_*` e `WIFI_*`.
 */
export const TenantConfig = z.object({
  tenantId: TenantId,
  nome: z.string().min(1).max(120),
  brand: z.string().max(60).nullable().optional(),
  area: z.string().max(60).nullable().optional(),
  sinceLabel: z.string().max(40).nullable().optional(),
  heroImageUrl: z.string().url().max(2000).nullable().optional(),
  wifiSsid: z.string().max(60).nullable().optional(),
  wifiPass: z.string().max(120).nullable().optional(),
  updatedAt: TimestampMs,
});
export type TenantConfig = z.infer<typeof TenantConfig>;
