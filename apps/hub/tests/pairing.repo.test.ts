import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('PairingRepo', () => {
  it('create gera codigo de 6 digitos com expiracao', () => {
    const row = ctx.repos.pairing.create({ tenantId: ctx.tenantId, role: 'totem' });
    expect(row.code).toMatch(/^\d{6}$/);
    expect(row.expiresAt).toBeGreaterThan(ctx.clock.now());
    expect(row.consumedAt).toBeNull();
  });

  it('consume marca consumedAt e retorna o registro', () => {
    const row = ctx.repos.pairing.create({ tenantId: ctx.tenantId, role: 'totem' });
    const consumed = ctx.repos.pairing.consume(row.code);
    expect(consumed.consumedAt).not.toBeNull();
    expect(consumed.role).toBe('totem');
  });

  it('consume duas vezes lanca ConflictError', () => {
    const row = ctx.repos.pairing.create({ tenantId: ctx.tenantId, role: 'kds' });
    ctx.repos.pairing.consume(row.code);
    expect(() => ctx.repos.pairing.consume(row.code)).toThrow(/already consumed/);
  });

  it('consume codigo expirado lanca ConflictError', () => {
    const row = ctx.repos.pairing.create({
      tenantId: ctx.tenantId,
      role: 'totem',
      ttlMs: 5_000,
    });
    ctx.clock.advance(10_000);
    expect(() => ctx.repos.pairing.consume(row.code)).toThrow(/expired/);
  });

  it('consume codigo inexistente lanca NotFoundError', () => {
    expect(() => ctx.repos.pairing.consume('999999')).toThrow(/not found/);
  });
});
