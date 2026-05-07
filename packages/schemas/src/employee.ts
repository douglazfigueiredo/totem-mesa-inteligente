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

/**
 * EmployeeConfig — payload sincronizado do cloud pro hub. pinHash usa
 * bcrypt no mesmo formato dos dois lados, então não há rehash; o hub só
 * armazena. Contém roles permitindo array vazio (gerente sem função
 * operacional, por exemplo) — o hub valida na hora do PIN.
 */
export const EmployeeConfig = z.object({
  id: EmployeeId,
  nome: z.string().min(1).max(80),
  pinHash: z.string().min(20),
  roles: z.array(EmployeeRole),
  isActive: z.boolean(),
});
export type EmployeeConfig = z.infer<typeof EmployeeConfig>;

export const EmployeesSnapshot = z.object({
  tenantId: TenantId,
  employees: z.array(EmployeeConfig),
  updatedAt: TimestampMs,
});
export type EmployeesSnapshot = z.infer<typeof EmployeesSnapshot>;
