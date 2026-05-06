import { z } from 'zod';
import {
  CategoryId,
  ModifierGroupId,
  ModifierId,
  ProductId,
  ProductVariantId,
  TenantId,
  TimestampMs,
} from './ids.js';
import { PriceCents, PriceDeltaCents } from './money.js';
import { VerticalConfig } from './vertical.js';

export const ItemDestino = z.enum(['cozinha', 'garcom']);
export type ItemDestino = z.infer<typeof ItemDestino>;

export const Modifier = z.object({
  id: ModifierId,
  groupId: ModifierGroupId,
  nome: z.string().min(1).max(80),
  priceDeltaCents: PriceDeltaCents,
  isAvailable: z.boolean().default(true),
  ordem: z.number().int().nonnegative().default(0),
});
export type Modifier = z.infer<typeof Modifier>;

export const ModifierGroup = z.object({
  id: ModifierGroupId,
  productId: ProductId,
  nome: z.string().min(1).max(80),
  selectionType: z.enum(['single', 'multi']),
  required: z.boolean().default(false),
  minSelect: z.number().int().nonnegative().default(0),
  maxSelect: z.number().int().positive().optional(),
  ordem: z.number().int().nonnegative().default(0),
  modifiers: z.array(Modifier).default([]),
});
export type ModifierGroup = z.infer<typeof ModifierGroup>;

export const ProductVariant = z.object({
  id: ProductVariantId,
  productId: ProductId,
  nome: z.string().min(1).max(60),
  priceCents: PriceCents,
  isDefault: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
  ordem: z.number().int().nonnegative().default(0),
});
export type ProductVariant = z.infer<typeof ProductVariant>;

export const Product = z.object({
  id: ProductId,
  tenantId: TenantId,
  categoryId: CategoryId,
  nome: z.string().min(1).max(120),
  descricao: z.string().max(500).optional(),
  imageUrl: z.string().url().optional(),
  basePriceCents: PriceCents,
  destino: ItemDestino,
  tempoEstimadoSec: z.number().int().nonnegative().default(0),
  isAvailable: z.boolean().default(true),
  isVegetarian: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  verticalConfig: VerticalConfig.optional(),
  variants: z.array(ProductVariant).default([]),
  modifierGroups: z.array(ModifierGroup).default([]),
  createdAt: TimestampMs,
  updatedAt: TimestampMs,
});
export type Product = z.infer<typeof Product>;

export const Category = z.object({
  id: CategoryId,
  tenantId: TenantId,
  nome: z.string().min(1).max(80),
  ordem: z.number().int().nonnegative().default(0),
  isActive: z.boolean().default(true),
});
export type Category = z.infer<typeof Category>;

export const CatalogSnapshot = z.object({
  tenantId: TenantId,
  version: z.number().int().nonnegative(),
  generatedAt: TimestampMs,
  categories: z.array(Category),
  products: z.array(Product),
});
export type CatalogSnapshot = z.infer<typeof CatalogSnapshot>;
