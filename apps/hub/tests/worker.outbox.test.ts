import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { startOutboxWorker } from '../src/workers/outbox.js';
import { newEventId } from '../src/lib/ids.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

const enqueue = () => {
  const id = newEventId();
  ctx.repos.outbox.enqueue({
    eventId: id,
    tenantId: ctx.tenantId,
    type: 'order:created',
    payload: { foo: 'bar' },
  });
  return id;
};

describe('outbox worker', () => {
  it('chama push para cada pending e marca sent', async () => {
    enqueue();
    enqueue();
    expect(ctx.repos.outbox.pendingCount()).toBe(2);

    const push = vi.fn().mockResolvedValue(undefined);
    const worker = startOutboxWorker({
      repos: ctx.repos,
      push,
      intervalMs: 60_000,
    });

    await worker.tick();

    expect(push).toHaveBeenCalledTimes(2);
    expect(ctx.repos.outbox.pendingCount()).toBe(0);

    await worker.stop();
  });

  it('marca failed e reagenda em backoff quando push falha', async () => {
    enqueue();
    const push = vi.fn().mockRejectedValue(new Error('cloud down'));
    const worker = startOutboxWorker({
      repos: ctx.repos,
      push,
      intervalMs: 60_000,
    });

    await worker.tick();
    expect(ctx.repos.outbox.pendingCount()).toBe(1);
    expect(ctx.repos.outbox.listPending()).toHaveLength(0);

    ctx.clock.advance(1_500);
    expect(ctx.repos.outbox.listPending()).toHaveLength(1);

    await worker.stop();
  });
});
