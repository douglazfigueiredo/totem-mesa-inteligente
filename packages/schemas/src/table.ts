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

/**
 * TableConfig — payload sincronizado do cloud pro hub. Subset de Table
 * com apenas os campos definidos pelo gerente (id/numero/capacidade/ativa).
 * Status e sessionStartedAt são runtime-only no hub.
 */
export const TableConfig = z.object({
  id: TableId,
  numero: z.number().int().positive(),
  capacidade: z.number().int().positive(),
  isActive: z.boolean(),
});
export type TableConfig = z.infer<typeof TableConfig>;

export const TablesSnapshot = z.object({
  tenantId: TenantId,
  tables: z.array(TableConfig),
  updatedAt: TimestampMs,
});
export type TablesSnapshot = z.infer<typeof TablesSnapshot>;
