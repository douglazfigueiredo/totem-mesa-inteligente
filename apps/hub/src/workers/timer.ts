import type { Repos } from '../repositories/index.js';
import type { Broadcaster } from '../lib/broadcaster.js';
import { makeEvent } from '../lib/events.js';

type LoggerLike = {
  info: (obj: object, msg?: string) => void;
  error: (obj: object, msg?: string) => void;
};

export type TimerWorkerOptions = {
  repos: Repos;
  broadcaster: Broadcaster;
  intervalMs?: number;
  logger?: LoggerLike;
};

export type WorkerHandle = {
  stop: () => Promise<void>;
  tick: () => Promise<void>;
};

export const startTimerWorker = (opts: TimerWorkerOptions): WorkerHandle => {
  const intervalMs = opts.intervalMs ?? 1000;
  let stopped = false;

  const tick = async (): Promise<void> => {
    if (stopped) return;
    const due = opts.repos.preparos.listDue();
    for (const preparo of due) {
      try {
        const ready = opts.repos.preparos.markReady(preparo.id);
        const order = opts.repos.orders.getById(preparo.orderId);
        if (order) {
          opts.repos.orders.updateStatus(preparo.orderId, 'pronto');
        }
        const event = makeEvent(
          'prep:ready',
          preparo.orderId
            ? (order?.tenantId ??
                opts.repos.orders.getByIdOrThrow(preparo.orderId).tenantId)
            : (() => {
                throw new Error('preparo without order');
              })(),
          {
            orderId: preparo.orderId,
            preparoId: ready.id,
            readyAt: ready.readyAt!,
          },
        );
        opts.repos.outbox.enqueue({
          eventId: event.eventId,
          tenantId: event.tenantId,
          type: 'prep:ready',
          payload: event.payload,
        });
        opts.broadcaster.broadcast(event);
        opts.logger?.info(
          { preparoId: ready.id, orderId: preparo.orderId },
          'timer due → prep:ready',
        );
      } catch (err) {
        opts.logger?.error({ err, preparoId: preparo.id }, 'failed to mark preparo ready');
      }
    }
  };

  const handle = setInterval(() => {
    void tick();
  }, intervalMs);

  return {
    tick,
    stop: async () => {
      stopped = true;
      clearInterval(handle);
    },
  };
};
