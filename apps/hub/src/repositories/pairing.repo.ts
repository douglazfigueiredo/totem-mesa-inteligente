import { and, eq, gt, isNull, lt } from 'drizzle-orm';
import { pairingCodes } from '../db/schema.js';
import type { DBClient } from '../db/index.js';
import type { Clock } from '../lib/clock.js';
import { newPairingCode } from '../lib/ids.js';
import { ConflictError, NotFoundError } from '../lib/errors.js';
import type { DeviceRole, TenantId } from '@app/schemas';

const DEFAULT_TTL_MS = 10 * 60 * 1000;

export type PairingCodeRow = {
  code: string;
  tenantId: TenantId;
  role: DeviceRole;
  expiresAt: number;
  consumedAt: number | null;
};

export const makePairingRepo = (db: DBClient, clock: Clock) => ({
  create(input: { tenantId: TenantId; role: DeviceRole; ttlMs?: number }): PairingCodeRow {
    const code = newPairingCode();
    const expiresAt = clock.now() + (input.ttlMs ?? DEFAULT_TTL_MS);
    const row = {
      code,
      tenantId: input.tenantId,
      role: input.role,
      expiresAt,
      consumedAt: null,
    };
    db.insert(pairingCodes).values(row).run();
    return row;
  },

  consume(code: string): PairingCodeRow {
    const now = clock.now();
    const row = db
      .select()
      .from(pairingCodes)
      .where(
        and(
          eq(pairingCodes.code, code),
          gt(pairingCodes.expiresAt, now),
          isNull(pairingCodes.consumedAt),
        ),
      )
      .get();
    if (!row) {
      const exists = db.select().from(pairingCodes).where(eq(pairingCodes.code, code)).get();
      if (!exists) throw new NotFoundError('pairing code not found');
      if (exists.consumedAt) throw new ConflictError('pairing code already consumed');
      throw new ConflictError('pairing code expired');
    }
    db.update(pairingCodes).set({ consumedAt: now }).where(eq(pairingCodes.code, code)).run();
    return { ...row, consumedAt: now } as PairingCodeRow;
  },

  pruneExpired(): number {
    const now = clock.now();
    const r = db.delete(pairingCodes).where(lt(pairingCodes.expiresAt, now)).run();
    return r.changes;
  },
});

export type PairingRepo = ReturnType<typeof makePairingRepo>;
