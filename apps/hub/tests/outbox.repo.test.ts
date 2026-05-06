import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { newEventId } from '../src/lib/ids.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

const enqueueSample = (id = newEventId()) => {
  ctx.repos.outbox.enqueue({
    eventId: id,
    tenantId: ctx.tenantId,
    type: 'order:created',
    payload: { hello: 'world' },
  });
  return id;
};

describe('OutboxRepo', () => {
  it('enqueue + listPending', () => {
    enqueueSample();
    expect(ctx.repos.outbox.pendingCount()).toBe(1);
    const pending = ctx.repos.outbox.listPending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.type).toBe('order:created');
  });

  it('enqueue de eventId duplicado e idempotente', () => {
    const id = enqueueSample();
    enqueueSample(id);
    expect(ctx.repos.outbox.pendingCount()).toBe(1);
  });

  it('markSent remove de pending', () => {
    const id = enqueueSample();
    ctx.repos.outbox.markSent(id);
    expect(ctx.repos.outbox.pendingCount()).toBe(0);
  });

  it('markFailed agenda retry com backoff', () => {
    const id = enqueueSample();
    ctx.repos.outbox.markFailed(id, 'timeout');
    expect(ctx.repos.outbox.pendingCount()).toBe(1);
    const pending = ctx.repos.outbox.listPending();
    expect(pending).toHaveLength(0);

    ctx.clock.advance(1_500);
    expect(ctx.repos.outbox.listPending()).toHaveLength(1);
  });

  it('backoff aumenta a cada falha', () => {
    const id = enqueueSample();
    ctx.repos.outbox.markFailed(id, 'try1');
    ctx.clock.advance(2_000);
    ctx.repos.outbox.markFailed(id, 'try2');
    expect(ctx.repos.outbox.listPending()).toHaveLength(0);
    ctx.clock.advance(1_000);
    expect(ctx.repos.outbox.listPending()).toHaveLength(0);
    ctx.clock.advance(1_500);
    expect(ctx.repos.outbox.listPending()).toHaveLength(1);
  });
});
