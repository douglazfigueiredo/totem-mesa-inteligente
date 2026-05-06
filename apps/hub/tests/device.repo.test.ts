import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { setupTestDB, type TestDB } from './setup.js';
import { generateApiKey } from '../src/repositories/device.repo.js';

let ctx: TestDB;

beforeEach(() => {
  ctx = setupTestDB();
});
afterEach(() => ctx.cleanup());

describe('DeviceRepo', () => {
  it('create + findByApiKey', () => {
    const apiKey = generateApiKey();
    const device = ctx.repos.devices.create({
      tenantId: ctx.tenantId,
      role: 'totem',
      nome: 'Totem Mesa 7',
      apiKey,
      tableId: ctx.tableId,
    });
    expect(device.role).toBe('totem');
    const found = ctx.repos.devices.findByApiKey(apiKey);
    expect(found?.id).toBe(device.id);
  });

  it('findByApiKey com chave errada retorna null', () => {
    const apiKey = generateApiKey();
    ctx.repos.devices.create({
      tenantId: ctx.tenantId,
      role: 'kds',
      nome: 'KDS 1',
      apiKey,
    });
    expect(ctx.repos.devices.findByApiKey('wrong-key')).toBeNull();
  });

  it('updateLastSeen atualiza timestamp', () => {
    const apiKey = generateApiKey();
    const device = ctx.repos.devices.create({
      tenantId: ctx.tenantId,
      role: 'kds',
      nome: 'KDS 1',
      apiKey,
    });
    ctx.clock.advance(5_000);
    ctx.repos.devices.updateLastSeen(device.id);
    const updated = ctx.repos.devices.findById(device.id);
    expect(updated?.lastSeenAt).toBe(ctx.clock.now());
  });

  it('deactivate remove visibilidade via findByApiKey', () => {
    const apiKey = generateApiKey();
    const device = ctx.repos.devices.create({
      tenantId: ctx.tenantId,
      role: 'totem',
      nome: 'Totem 1',
      apiKey,
    });
    ctx.repos.devices.deactivate(device.id);
    expect(ctx.repos.devices.findByApiKey(apiKey)).toBeNull();
  });
});
