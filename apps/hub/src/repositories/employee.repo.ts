import bcrypt from 'bcryptjs';

const { compareSync, hashSync } = bcrypt;
import { and, eq } from 'drizzle-orm';
import { employees } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newEmployeeId } from '../lib/ids.js';
import {
  Employee,
  type EmployeeConfig,
  type EmployeeId,
  type EmployeeRole,
  type TenantId,
} from '@app/schemas';

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

  /**
   * Sincroniza funcionários vindos do cloud. pinHash chega já hasheado
   * no formato bcrypt — não rehashear. Não removemos employees ausentes
   * do snapshot pra preservar histórico de pedidos/preparos que apontam
   * pra essas linhas. Gerente desativa via cloud (isActive=false).
   */
  upsertFromCloud(
    tenantId: TenantId,
    snapshot: EmployeeConfig[],
  ): { inserted: number; updated: number } {
    let inserted = 0;
    let updated = 0;
    db.transaction((tx) => {
      for (const e of snapshot) {
        const existing = tx.select().from(employees).where(eq(employees.id, e.id)).get();
        if (existing) {
          tx.update(employees)
            .set({
              nome: e.nome,
              pinHash: e.pinHash,
              roles: e.roles,
              isActive: e.isActive,
            })
            .where(eq(employees.id, e.id))
            .run();
          updated++;
        } else {
          tx.insert(employees)
            .values({
              id: e.id,
              tenantId,
              nome: e.nome,
              pinHash: e.pinHash,
              roles: e.roles,
              isActive: e.isActive,
              createdAt: clock.now(),
            })
            .run();
          inserted++;
        }
      }
    });
    return { inserted, updated };
  },
});

export type EmployeeRepo = ReturnType<typeof makeEmployeeRepo>;
