import bcrypt from 'bcryptjs';

const { compareSync, hashSync } = bcrypt;
import { and, eq } from 'drizzle-orm';
import { employees } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newEmployeeId } from '../lib/ids.js';
import { Employee, type EmployeeId, type EmployeeRole, type TenantId } from '@app/schemas';

const BCRYPT_ROUNDS = 10;

export const hashPin = (pin: string): string => hashSync(pin, BCRYPT_ROUNDS);

export const makeEmployeeRepo = (db: DBClient, clock: Clock) => ({
  create(input: {
    tenantId: TenantId;
    nome: string;
    pin: string;
    roles: EmployeeRole[];
  }): Employee {
    if (!/^\d{4,6}$/.test(input.pin)) {
      throw new Error('PIN must be 4-6 digits');
    }
    const id = newEmployeeId() as EmployeeId;
    const row = {
      id,
      tenantId: input.tenantId,
      nome: input.nome,
      pinHash: hashPin(input.pin),
      roles: input.roles,
      isActive: true,
      createdAt: clock.now(),
    };
    db.insert(employees).values(row).run();
    return Employee.parse(row);
  },

  findByPin(tenantId: TenantId, pin: string): Employee | null {
    const all = db
      .select()
      .from(employees)
      .where(and(eq(employees.tenantId, tenantId), eq(employees.isActive, true)))
      .all();
    for (const row of all) {
      if (compareSync(pin, row.pinHash)) {
        return Employee.parse(row);
      }
    }
    return null;
  },

  getById(id: EmployeeId): Employee | null {
    const row = db.select().from(employees).where(eq(employees.id, id)).get();
    return row ? Employee.parse(row) : null;
  },

  list(tenantId: TenantId): Employee[] {
    const rows = db
      .select()
      .from(employees)
      .where(and(eq(employees.tenantId, tenantId), eq(employees.isActive, true)))
      .all();
    return rows.map((r) => Employee.parse(r));
  },
});

export type EmployeeRepo = ReturnType<typeof makeEmployeeRepo>;
