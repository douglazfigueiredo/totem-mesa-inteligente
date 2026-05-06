import { z } from 'zod';
import { EmployeeId, OrderId, PreparoId, TimestampMs } from './ids.js';

export const PreparoStatus = z.enum(['preparando', 'pronto', 'cancelado']);
export type PreparoStatus = z.infer<typeof PreparoStatus>;

export const Preparo = z.object({
  id: PreparoId,
  orderId: OrderId,
  status: PreparoStatus,
  startedAt: TimestampMs,
  durationSec: z.number().int().positive(),
  startedByEmployeeId: EmployeeId,
  readyAt: TimestampMs.optional(),
  cancelledAt: TimestampMs.optional(),
});
export type Preparo = z.infer<typeof Preparo>;

export const computeRemainingSec = (
  preparo: { startedAt: number; durationSec: number },
  nowMs: number,
): number => Math.max(preparo.durationSec - Math.floor((nowMs - preparo.startedAt) / 1000), 0);

export const isReady = (
  preparo: { startedAt: number; durationSec: number },
  nowMs: number,
): boolean => computeRemainingSec(preparo, nowMs) === 0;
