import { z } from 'zod';
import { EmployeeId, TenantId, TimestampMs } from './ids.js';

export const EmployeeRole = z.enum(['cozinheiro', 'garcom', 'gerente', 'caixa']);
export type EmployeeRole = z.infer<typeof EmployeeRole>;

export const Employee = z.object({
  id: EmployeeId,
  tenantId: TenantId,
  nome: z.string().min(1).max(80),
  pinHash: z.string().min(20),
  roles: z.array(EmployeeRole).min(1),
  isActive: z.boolean().default(true),
  createdAt: TimestampMs,
});
export type Employee = z.infer<typeof Employee>;
