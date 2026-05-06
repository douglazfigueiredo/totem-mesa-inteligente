import { z } from 'zod';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const brandedId = <B extends string>(brand: B) =>
  z.string().regex(UUID_RE, 'invalid uuid').brand<B>();

export const TenantId = brandedId('TenantId');
export const DeviceId = brandedId('DeviceId');
export const TableId = brandedId('TableId');
export const EmployeeId = brandedId('EmployeeId');
export const CategoryId = brandedId('CategoryId');
export const ProductId = brandedId('ProductId');
export const ProductVariantId = brandedId('ProductVariantId');
export const ModifierGroupId = brandedId('ModifierGroupId');
export const ModifierId = brandedId('ModifierId');
export const OrderId = brandedId('OrderId');
export const OrderItemId = brandedId('OrderItemId');
export const WaiterCallId = brandedId('WaiterCallId');
export const PreparoId = brandedId('PreparoId');
export const PaymentId = brandedId('PaymentId');
export const EventId = brandedId('EventId');

export type TenantId = z.infer<typeof TenantId>;
export type DeviceId = z.infer<typeof DeviceId>;
export type TableId = z.infer<typeof TableId>;
export type EmployeeId = z.infer<typeof EmployeeId>;
export type CategoryId = z.infer<typeof CategoryId>;
export type ProductId = z.infer<typeof ProductId>;
export type ProductVariantId = z.infer<typeof ProductVariantId>;
export type ModifierGroupId = z.infer<typeof ModifierGroupId>;
export type ModifierId = z.infer<typeof ModifierId>;
export type OrderId = z.infer<typeof OrderId>;
export type OrderItemId = z.infer<typeof OrderItemId>;
export type WaiterCallId = z.infer<typeof WaiterCallId>;
export type PreparoId = z.infer<typeof PreparoId>;
export type PaymentId = z.infer<typeof PaymentId>;
export type EventId = z.infer<typeof EventId>;

export const TimestampMs = z.number().int().nonnegative();
export type TimestampMs = z.infer<typeof TimestampMs>;

export const Slug = z
  .string()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'invalid slug');
export type Slug = z.infer<typeof Slug>;
