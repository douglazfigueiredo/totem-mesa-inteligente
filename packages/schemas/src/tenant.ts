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
