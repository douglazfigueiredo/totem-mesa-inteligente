import { z } from 'zod';
import { ItemDestino } from './catalog.js';
import {
  ModifierGroupId,
  ModifierId,
  OrderId,
  OrderItemId,
  ProductId,
  ProductVariantId,
  TableId,
  TenantId,
  TimestampMs,
} from './ids.js';
import { Bps, PriceCents } from './money.js';
import { PontoDaCarne } from './vertical.js';

export const OrderStatus = z.enum([
  'criado',
  'enviado',
  'preparando',
  'pronto',
  'entregue',
  'cancelado',
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const OrderDestino = z.enum(['cozinha', 'garcom', 'ambos']);
export type OrderDestino = z.infer<typeof OrderDestino>;

export const ModifierSelection = z.object({
  groupId: ModifierGroupId,
  modifierIds: z.array(ModifierId).min(1),
});
export type ModifierSelection = z.infer<typeof ModifierSelection>;

export const ItemCustomization = z.object({
  variantId: ProductVariantId.optional(),
  modifiers: z.array(ModifierSelection).default([]),
  obs: z.string().max(500).optional(),
  pizzaSabores: z.array(ProductId).max(4).optional(),
  pontoDaCarne: PontoDaCarne.optional(),
});
export type ItemCustomization = z.infer<typeof ItemCustomization>;

export const OrderItem = z.object({
  id: OrderItemId,
  productId: ProductId,
  nome: z.string().min(1).max(120),
  destino: ItemDestino,
  qty: z.number().int().min(1).max(99),
  unitPriceCents: PriceCents,
  totalPriceCents: PriceCents,
  tempoEstimadoSec: z.number().int().nonnegative(),
  customization: ItemCustomization.optional(),
});
export type OrderItem = z.infer<typeof OrderItem>;

export const Order = z.object({
  id: OrderId,
  tenantId: TenantId,
  tableId: TableId,
  status: OrderStatus,
  destino: OrderDestino,
  items: z.array(OrderItem).min(1),
  subtotalCents: PriceCents,
  taxaServicoBps: Bps.default(1000),
  taxaServicoCents: PriceCents.default(0),
  totalCents: PriceCents,
  obs: z.string().max(500).optional(),
  createdAt: TimestampMs,
  sentAt: TimestampMs.optional(),
  cancelledAt: TimestampMs.optional(),
  cancelReason: z.string().max(200).optional(),
});
export type Order = z.infer<typeof Order>;
