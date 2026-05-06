import { createHash, randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { devices } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newDeviceId } from '../lib/ids.js';
import { NotFoundError } from '../lib/errors.js';
import type { DeviceId, DeviceRole, TableId, TenantId } from '@app/schemas';

export const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');

export const generateApiKey = (): string => randomBytes(32).toString('base64url');

export type DeviceRow = {
  id: DeviceId;
  tenantId: TenantId;
  role: DeviceRole;
  nome: string;
  tableId: TableId | null;
  apiKeyHash: string;
  pairedAt: number;
  lastSeenAt: number | null;
  isActive: boolean;
};

export const makeDeviceRepo = (db: DBClient, clock: Clock) => ({
  create(input: {
    tenantId: TenantId;
    role: DeviceRole;
    nome: string;
    apiKey: string;
    tableId?: TableId;
  }): DeviceRow {
    const id = newDeviceId() as DeviceId;
    const row = {
      id,
      tenantId: input.tenantId,
      role: input.role,
      nome: input.nome,
      tableId: input.tableId ?? null,
      apiKeyHash: sha256(input.apiKey),
      pairedAt: clock.now(),
      lastSeenAt: null,
      isActive: true,
    };
    db.insert(devices).values(row).run();
    return row as DeviceRow;
  },

  findByApiKey(apiKey: string): DeviceRow | null {
    const hash = sha256(apiKey);
    const row = db
      .select()
      .from(devices)
      .where(and(eq(devices.apiKeyHash, hash), eq(devices.isActive, true)))
      .get();
    return row ? (row as DeviceRow) : null;
  },

  findById(id: DeviceId): DeviceRow | null {
    const row = db.select().from(devices).where(eq(devices.id, id)).get();
    return row ? (row as DeviceRow) : null;
  },

  updateLastSeen(id: DeviceId): void {
    db.update(devices).set({ lastSeenAt: clock.now() }).where(eq(devices.id, id)).run();
  },

  deactivate(id: DeviceId): void {
    const r = db
      .update(devices)
      .set({ isActive: false })
      .where(eq(devices.id, id))
      .run();
    if (r.changes === 0) throw new NotFoundError(`device ${id} not found`);
  },
});

export type DeviceRepo = ReturnType<typeof makeDeviceRepo>;
