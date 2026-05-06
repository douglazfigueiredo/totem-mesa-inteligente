import { z } from 'zod';
import { DeviceId, TableId, TenantId, TimestampMs } from './ids.js';

export const DeviceRole = z.enum(['totem', 'kds', 'waiter', 'admin']);
export type DeviceRole = z.infer<typeof DeviceRole>;

export const Device = z.object({
  id: DeviceId,
  tenantId: TenantId,
  role: DeviceRole,
  nome: z.string().min(1).max(80),
  tableId: TableId.optional(),
  apiKeyHash: z.string().min(32),
  pairedAt: TimestampMs,
  lastSeenAt: TimestampMs.optional(),
  isActive: z.boolean().default(true),
});
export type Device = z.infer<typeof Device>;

export const PairingCode = z.object({
  code: z.string().regex(/^\d{6}$/, 'codigo deve ter 6 digitos'),
  tenantId: TenantId,
  role: DeviceRole,
  expiresAt: TimestampMs,
  consumedAt: TimestampMs.optional(),
});
export type PairingCode = z.infer<typeof PairingCode>;
