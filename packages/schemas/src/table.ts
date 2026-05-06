import { z } from 'zod';
import { TableId, TenantId, TimestampMs } from './ids.js';

export const TableStatus = z.enum(['livre', 'ocupada', 'reservada', 'fechando']);
export type TableStatus = z.infer<typeof TableStatus>;

export const Table = z.object({
  id: TableId,
  tenantId: TenantId,
  numero: z.number().int().positive(),
  capacidade: z.number().int().positive().default(4),
  status: TableStatus.default('livre'),
  sessionStartedAt: TimestampMs.optional(),
});
export type Table = z.infer<typeof Table>;
