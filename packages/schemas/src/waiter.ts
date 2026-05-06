import { z } from 'zod';
import { EmployeeId, TableId, TenantId, TimestampMs, WaiterCallId } from './ids.js';

export const WaiterCallReason = z.enum([
  'talheres',
  'agua',
  'ajuda_pedido',
  'fechar_conta',
  'outros',
]);
export type WaiterCallReason = z.infer<typeof WaiterCallReason>;

export const WaiterCallStatus = z.enum(['pending', 'acknowledged', 'resolved', 'escalated']);
export type WaiterCallStatus = z.infer<typeof WaiterCallStatus>;

export const WaiterCall = z.object({
  id: WaiterCallId,
  tenantId: TenantId,
  tableId: TableId,
  reason: WaiterCallReason,
  obs: z.string().max(200).optional(),
  status: WaiterCallStatus,
  createdAt: TimestampMs,
  acknowledgedBy: EmployeeId.optional(),
  acknowledgedAt: TimestampMs.optional(),
  resolvedAt: TimestampMs.optional(),
  escalationLevel: z.number().int().min(0).max(2).default(0),
});
export type WaiterCall = z.infer<typeof WaiterCall>;
