import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  applyBps,
  CategoryId,
  computeRemainingSec,
  EmployeeId,
  EventId,
  formatBRL,
  HeartbeatEvent,
  ItemCustomization,
  isReady,
  Order,
  OrderCreateEvent,
  OrderId,
  OrderItemId,
  OrderStatus,
  PrepStartedEvent,
  Preparo,
  PreparoId,
  ProductId,
  Slug,
  TableId,
  Tenant,
  TenantId,
  Vertical,
  VerticalConfig,
  WSEvent,
  WS_EVENT_TYPES,
  WaiterCall,
  WaiterCallId,
} from '../src/index.js';

const uuid = () => randomUUID();

const aTenant = (): typeof Tenant._type => ({
  id: TenantId.parse(uuid()),
  slug: Slug.parse('pizza-da-mama'),
  nome: 'Pizza da Mama',
  vertical: Vertical.parse('pizzaria'),
  features: {
    mesas: true,
    comanda: false,
    balcao: false,
    retirada: false,
    delivery: false,
    pizzaMetade: true,
    combo: false,
  },
  timezone: 'America/Sao_Paulo',
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
});

describe('ids', () => {
  it('aceita UUID v1-v8', () => {
    expect(() => TenantId.parse('00000000-0000-1000-8000-000000000000')).not.toThrow();
    expect(() => TenantId.parse('00000000-0000-7000-8000-000000000000')).not.toThrow();
    expect(() => TenantId.parse(randomUUID())).not.toThrow();
  });

  it('rejeita strings nao-uuid', () => {
    expect(() => TenantId.parse('nao-eh-uuid')).toThrow();
    expect(() => TenantId.parse('')).toThrow();
  });

  it('Slug rejeita maiusculas e caracteres especiais', () => {
    expect(() => Slug.parse('pizza-da-mama')).not.toThrow();
    expect(() => Slug.parse('Pizza-Mama')).toThrow();
    expect(() => Slug.parse('-pizza')).toThrow();
    expect(() => Slug.parse('pizza-')).toThrow();
    expect(() => Slug.parse('pi')).not.toThrow();
    expect(() => Slug.parse('p')).toThrow();
  });
});

describe('money', () => {
  it('formatBRL formata em pt-BR', () => {
    expect(formatBRL(0)).toContain('0,00');
    expect(formatBRL(1234)).toContain('12,34');
    expect(formatBRL(123456)).toMatch(/1\.234,56/);
  });

  it('applyBps calcula taxa em basis points', () => {
    expect(applyBps(10000, 1000)).toBe(1000);
    expect(applyBps(10000, 0)).toBe(0);
    expect(applyBps(12345, 1000)).toBe(1235);
  });
});

describe('Tenant', () => {
  it('round-trip preserva todos os campos', () => {
    const t = aTenant();
    const parsed = Tenant.parse(JSON.parse(JSON.stringify(t)));
    expect(parsed).toEqual(t);
  });

  it('rejeita vertical desconhecida', () => {
    const t = { ...aTenant(), vertical: 'cafeteria' };
    expect(() => Tenant.parse(t)).toThrow();
  });
});

describe('VerticalConfig', () => {
  it('discrimina por tipo', () => {
    expect(VerticalConfig.parse({ tipo: 'pizza', saboresMax: 2, bordaRecheadaDisponivel: true }))
      .toMatchObject({ tipo: 'pizza' });
    expect(VerticalConfig.parse({ tipo: 'lanche', pontoDaCarneDisponivel: ['mal', 'medio'] }))
      .toMatchObject({ tipo: 'lanche' });
    expect(VerticalConfig.parse({ tipo: 'simples' })).toMatchObject({ tipo: 'simples' });
  });

  it('rejeita tipo invalido', () => {
    expect(() => VerticalConfig.parse({ tipo: 'inexistente' })).toThrow();
  });
});

describe('ItemCustomization', () => {
  it('aceita pizza meio-a-meio com sabores', () => {
    const c = ItemCustomization.parse({
      modifiers: [],
      pizzaSabores: [ProductId.parse(uuid()), ProductId.parse(uuid())],
      obs: 'sem cebola',
    });
    expect(c.pizzaSabores).toHaveLength(2);
  });

  it('rejeita mais de 4 sabores', () => {
    const sabores = Array.from({ length: 5 }, () => ProductId.parse(uuid()));
    expect(() => ItemCustomization.parse({ modifiers: [], pizzaSabores: sabores })).toThrow();
  });

  it('aceita ponto da carne valido', () => {
    expect(() =>
      ItemCustomization.parse({ modifiers: [], pontoDaCarne: 'medio' }),
    ).not.toThrow();
    expect(() =>
      ItemCustomization.parse({ modifiers: [], pontoDaCarne: 'queimado' }),
    ).toThrow();
  });
});

describe('Order', () => {
  const aOrder = (): typeof Order._type => ({
    id: OrderId.parse(uuid()),
    tenantId: TenantId.parse(uuid()),
    tableId: TableId.parse(uuid()),
    status: OrderStatus.parse('criado'),
    destino: 'cozinha',
    items: [
      {
        id: OrderItemId.parse(uuid()),
        productId: ProductId.parse(uuid()),
        nome: 'Pizza Margherita',
        destino: 'cozinha',
        qty: 1,
        unitPriceCents: 4500,
        totalPriceCents: 4500,
        tempoEstimadoSec: 1320,
      },
    ],
    subtotalCents: 4500,
    taxaServicoBps: 1000,
    taxaServicoCents: 450,
    totalCents: 4950,
    createdAt: Date.now(),
  });

  it('round-trip', () => {
    const o = aOrder();
    expect(Order.parse(JSON.parse(JSON.stringify(o)))).toEqual(o);
  });

  it('exige pelo menos 1 item', () => {
    const o = { ...aOrder(), items: [] };
    expect(() => Order.parse(o)).toThrow();
  });

  it('rejeita qty fora do intervalo', () => {
    const o = aOrder();
    o.items[0]!.qty = 0;
    expect(() => Order.parse(o)).toThrow();
    o.items[0]!.qty = 100;
    expect(() => Order.parse(o)).toThrow();
  });
});

describe('Preparo helpers', () => {
  const preparo: Pick<typeof Preparo._type, 'startedAt' | 'durationSec'> = {
    startedAt: 1_000_000_000_000,
    durationSec: 1320,
  };

  it('computeRemainingSec', () => {
    expect(computeRemainingSec(preparo, preparo.startedAt)).toBe(1320);
    expect(computeRemainingSec(preparo, preparo.startedAt + 60_000)).toBe(1260);
    expect(computeRemainingSec(preparo, preparo.startedAt + 1320 * 1000)).toBe(0);
    expect(computeRemainingSec(preparo, preparo.startedAt + 9_999_999)).toBe(0);
  });

  it('isReady', () => {
    expect(isReady(preparo, preparo.startedAt)).toBe(false);
    expect(isReady(preparo, preparo.startedAt + 1320 * 1000 + 1)).toBe(true);
  });
});

describe('WaiterCall', () => {
  it('aceita razoes validas', () => {
    expect(() =>
      WaiterCall.parse({
        id: WaiterCallId.parse(uuid()),
        tenantId: TenantId.parse(uuid()),
        tableId: TableId.parse(uuid()),
        reason: 'agua',
        status: 'pending',
        createdAt: Date.now(),
        escalationLevel: 0,
      }),
    ).not.toThrow();
  });
});

describe('WSEvent (discriminated union)', () => {
  const aOrderCreate = () =>
    OrderCreateEvent.parse({
      eventId: EventId.parse(uuid()),
      tenantId: TenantId.parse(uuid()),
      ts: Date.now(),
      type: 'order:create',
      payload: {
        tableId: TableId.parse(uuid()),
        items: [
          {
            productId: ProductId.parse(uuid()),
            qty: 2,
          },
        ],
        taxaServicoBps: 1000,
      },
    });

  it('parses um evento order:create', () => {
    expect(aOrderCreate().type).toBe('order:create');
  });

  it('WSEvent reconhece todos os 15 tipos', () => {
    expect(WS_EVENT_TYPES).toHaveLength(15);
  });

  it('WSEvent rejeita tipo desconhecido', () => {
    expect(() =>
      WSEvent.parse({
        eventId: EventId.parse(uuid()),
        tenantId: TenantId.parse(uuid()),
        ts: Date.now(),
        type: 'order:fake',
        payload: {},
      }),
    ).toThrow();
  });

  it('heartbeat exige serverTime no payload', () => {
    expect(() =>
      HeartbeatEvent.parse({
        eventId: EventId.parse(uuid()),
        tenantId: TenantId.parse(uuid()),
        ts: Date.now(),
        type: 'heartbeat',
        payload: {},
      }),
    ).toThrow();
    expect(() =>
      HeartbeatEvent.parse({
        eventId: EventId.parse(uuid()),
        tenantId: TenantId.parse(uuid()),
        ts: Date.now(),
        type: 'heartbeat',
        payload: { serverTime: Date.now() },
      }),
    ).not.toThrow();
  });

  it('prep:started carrega Preparo completo', () => {
    const ev = PrepStartedEvent.parse({
      eventId: EventId.parse(uuid()),
      tenantId: TenantId.parse(uuid()),
      ts: Date.now(),
      type: 'prep:started',
      payload: {
        preparo: {
          id: PreparoId.parse(uuid()),
          orderId: OrderId.parse(uuid()),
          status: 'preparando',
          startedAt: Date.now(),
          durationSec: 1320,
          startedByEmployeeId: EmployeeId.parse(uuid()),
        },
        serverTime: Date.now(),
      },
    });
    expect(ev.payload.preparo.durationSec).toBe(1320);
  });
});

describe('CategoryId branding', () => {
  it('funciona com brands tipo CategoryId', () => {
    const id = CategoryId.parse(uuid());
    expect(typeof id).toBe('string');
  });
});
