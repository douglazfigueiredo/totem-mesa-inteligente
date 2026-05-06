import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { newEventId } from '../src/lib/ids.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('IdempotencyRepo', () => {
  it('record + has', () => {
    const id = newEventId();
    expect(ctx.repos.idempotency.has(id)).toBe(false);
    ctx.repos.idempotency.record({ eventId: id, type: 'order:create' });
    expect(ctx.repos.idempotency.has(id)).toBe(true);
  });

  it('record duplicado e no-op', () => {
    const id = newEventId();
    ctx.repos.idempotency.record({ eventId: id, type: 'order:create', result: { ok: 1 } });
    ctx.repos.idempotency.record({ eventId: id, type: 'order:create', result: { ok: 2 } });
    const got = ctx.repos.idempotency.get(id);
    expect(got?.resultJson).toContain('"ok":1');
  });

  it('pruneBefore remove eventos antigos', () => {
    const idOld = newEventId();
    ctx.repos.idempotency.record({ eventId: idOld, type: 'heartbeat' });
    ctx.clock.advance(60 * 60 * 1_000);
    const idNew = newEventId();
    ctx.repos.idempotency.record({ eventId: idNew, type: 'heartbeat' });

    const removed = ctx.repos.idempotency.pruneBefore(30 * 60 * 1_000);
    expect(removed).toBe(1);
    expect(ctx.repos.idempotency.has(idOld)).toBe(false);
    expect(ctx.repos.idempotency.has(idNew)).toBe(true);
  });
});
