import { z } from 'zod';
import { ItemDestino } from './catalog.js';
import {
  EmployeeId,
  EventId,
  OrderId,
  PreparoId,
  ProductId,
  TableId,
  TenantId,
  TimestampMs,
  WaiterCallId,
} from './ids.js';
import { Bps, PriceCents } from './money.js';
import { Order, OrderItem, OrderStatus } from './order.js';
import { Preparo } from './preparo.js';
import { WaiterCall, WaiterCallReason } from './waiter.js';

const baseEnvelope = {
  eventId: EventId,
  tenantId: TenantId,
  ts: TimestampMs,
  causedBy: EventId.optional(),
};

const OrderCreateInputItem = OrderItem.pick({
  productId: true,
  qty: true,
  customization: true,
});

export const OrderCreateEvent = z.object({
  ...baseEnvelope,
  type: z.literal('order:create'),
  payload: z.object({
    tableId: TableId,
    items: z.array(OrderCreateInputItem).min(1),
    obs: z.string().max(500).optional(),
    taxaServicoBps: Bps.default(1000),
  }),
});

export const OrderCreatedEvent = z.object({
  ...baseEnvelope,
  type: z.literal('order:created'),
  payload: z.object({
    order: Order,
  }),
});

export const PrepStartEvent = z.object({
  ...baseEnvelope,
  type: z.literal('prep:start'),
  payload: z.object({
    orderId: OrderId,
    employeeId: EmployeeId,
    durationSec: z.number().int().positive(),
  }),
});

export const PrepStartedEvent = z.object({
  ...baseEnvelope,
  type: z.literal('prep:started'),
  payload: z.object({
    preparo: Preparo,
    serverTime: TimestampMs,
  }),
});

export const PrepReadyEvent = z.object({
  ...baseEnvelope,
  type: z.literal('prep:ready'),
  payload: z.object({
    orderId: OrderId,
    preparoId: PreparoId,
    readyAt: TimestampMs,
  }),
});

export const OrderCancelEvent = z.object({
  ...baseEnvelope,
  type: z.literal('order:cancel'),
  payload: z.object({
    orderId: OrderId,
    reason: z.string().max(200),
    cancelledBy: EmployeeId.optional(),
  }),
});

export const ItemUnavailableEvent = z.object({
  ...baseEnvelope,
  type: z.literal('item:unavailable'),
  payload: z.object({
    productId: ProductId,
    suggestedSubstitutes: z.array(ProductId).default([]),
    affectedOrderIds: z.array(OrderId).default([]),
  }),
});

export const WaiterCallCreateEvent = z.object({
  ...baseEnvelope,
  type: z.literal('waiter:call'),
  payload: z.object({
    tableId: TableId,
    reason: WaiterCallReason,
    obs: z.string().max(200).optional(),
    callId: WaiterCallId.optional(),
    createdAt: TimestampMs.optional(),
  }),
});

export const WaiterAckEvent = z.object({
  ...baseEnvelope,
  type: z.literal('waiter:ack'),
  payload: z.object({
    callId: WaiterCallId,
    employeeId: EmployeeId,
  }),
});

export const WaiterResolvedEvent = z.object({
  ...baseEnvelope,
  type: z.literal('waiter:resolved'),
  payload: z.object({
    callId: WaiterCallId,
    employeeId: EmployeeId,
  }),
});

export const TableCloseEvent = z.object({
  ...baseEnvelope,
  type: z.literal('table:close'),
  payload: z.object({
    tableId: TableId,
    closedBy: EmployeeId,
  }),
});

export const PaymentRequestEvent = z.object({
  ...baseEnvelope,
  type: z.literal('payment:request'),
  payload: z.object({
    tableId: TableId,
    amountCents: PriceCents,
    method: z.enum(['credit', 'debit', 'pix', 'caixa']),
    splitMode: z.enum(['single', 'equal', 'per_item', 'amount']).default('single'),
  }),
});

export const PaymentConfirmedEvent = z.object({
  ...baseEnvelope,
  type: z.literal('payment:confirmed'),
  payload: z.object({
    tableId: TableId,
    amountCents: PriceCents,
    method: z.string(),
    receiptUrl: z.string().url().optional(),
  }),
});

export const StateSyncEvent = z.object({
  ...baseEnvelope,
  type: z.literal('state:sync'),
  payload: z.object({
    tableId: TableId,
    lastEventId: EventId.optional(),
    serverTime: TimestampMs,
    activeOrders: z.array(Order).default([]),
    activePreparos: z.array(Preparo).default([]),
    pendingWaiterCalls: z.array(WaiterCall).default([]),
    orderStatuses: z.array(z.object({ orderId: OrderId, status: OrderStatus })).default([]),
  }),
});

export const HeartbeatEvent = z.object({
  ...baseEnvelope,
  type: z.literal('heartbeat'),
  payload: z.object({
    serverTime: TimestampMs,
    deviceClientTime: TimestampMs.optional(),
  }),
});

export const WSEvent = z.discriminatedUnion('type', [
  OrderCreateEvent,
  OrderCreatedEvent,
  PrepStartEvent,
  PrepStartedEvent,
  PrepReadyEvent,
  OrderCancelEvent,
  ItemUnavailableEvent,
  WaiterCallCreateEvent,
  WaiterAckEvent,
  WaiterResolvedEvent,
  TableCloseEvent,
  PaymentRequestEvent,
  PaymentConfirmedEvent,
  StateSyncEvent,
  HeartbeatEvent,
]);
export type WSEvent = z.infer<typeof WSEvent>;

export type WSEventType = WSEvent['type'];

export type WSEventByType<T extends WSEventType> = Extract<WSEvent, { type: T }>;

export const WS_EVENT_TYPES = [
  'order:create',
  'order:created',
  'prep:start',
  'prep:started',
  'prep:ready',
  'order:cancel',
  'item:unavailable',
  'waiter:call',
  'waiter:ack',
  'waiter:resolved',
  'table:close',
  'payment:request',
  'payment:confirmed',
  'state:sync',
  'heartbeat',
] as const satisfies ReadonlyArray<WSEventType>;

export type ItemDestinoType = z.infer<typeof ItemDestino>;
