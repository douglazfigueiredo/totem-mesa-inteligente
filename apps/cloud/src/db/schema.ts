import {
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
  index,
  integer,
  boolean,
  jsonb,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * tenants — uma loja (pizzaria/restaurante/lanchonete/hamburgueria).
 * `slug` é usado em URLs `/t/[slug]/...`.
 * `vertical` segmenta features (pizza meio-a-meio, ponto da carne, etc).
 */
export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    nome: text('nome').notNull(),
    vertical: text('vertical').notNull().default('pizzaria'),
    brand: text('brand'),
    area: text('area'),
    sinceLabel: text('since_label'),
    heroImageUrl: text('hero_image_url'),
    wifiSsid: text('wifi_ssid'),
    wifiPass: text('wifi_pass'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index('tenants_slug_ix').on(t.slug),
  }),
);

/**
 * owners — proprietários autenticados via NextAuth (e-mail magic-link).
 * Uma owner pode estar vinculada a múltiplos tenants via tenant_owners.
 */
export const owners = pgTable('owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * tenant_owners — tabela de junção many-to-many.
 * `role` futuro: 'owner' | 'manager' | 'staff'. Por hora só 'owner'.
 */
export const tenantOwners = pgTable(
  'tenant_owners',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('owner'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tenantId, t.ownerId] }),
  }),
);

/**
 * hubs — instâncias do hub local registradas (uma por loja, geralmente).
 * Pareadas via hub_pairings.
 */
export const hubs = pgTable(
  'hubs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    apiKey: text('api_key').notNull().unique(),
    pairedAt: timestamp('paired_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
    version: text('version'),
  },
  (t) => ({
    tenantIdx: index('hubs_tenant_ix').on(t.tenantId),
    apiKeyIdx: index('hubs_api_key_ix').on(t.apiKey),
  }),
);

/**
 * hub_pairings — códigos one-shot pra parear um hub novo com um tenant.
 * Gerente cria via painel (gera código 6 dígitos), entra no hub, hub
 * troca código por apiKey + tenantId.
 */
export const hubPairings = pgTable(
  'hub_pairings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    consumedByHubId: uuid('consumed_by_hub_id').references(() => hubs.id),
    createdByOwnerId: uuid('created_by_owner_id').references(() => owners.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    codeIdx: index('hub_pairings_code_ix').on(t.code),
    tenantIdx: index('hub_pairings_tenant_ix').on(t.tenantId),
  }),
);

/**
 * categories — categorias do cardápio (Pizzas, Bebidas, Sobremesas…).
 * Escopo por tenant; `ordem` define a posição na home do totem.
 */
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    ordem: integer('ordem').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('categories_tenant_ix').on(t.tenantId),
    tenantOrdemIdx: index('categories_tenant_ordem_ix').on(t.tenantId, t.ordem),
  }),
);

/**
 * products — itens vendáveis do cardápio.
 * `destino` decide se vai pro KDS ('cozinha') ou aparece direto no app
 * do garçom ('garcom'). Variants e modifierGroups chegam na 6C.3.
 */
export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    descricao: text('descricao'),
    imageUrl: text('image_url'),
    basePriceCents: integer('base_price_cents').notNull(),
    destino: text('destino').notNull().default('cozinha'),
    tempoEstimadoSec: integer('tempo_estimado_sec').notNull().default(0),
    isAvailable: boolean('is_available').notNull().default(true),
    isVegetarian: boolean('is_vegetarian').notNull().default(false),
    isGlutenFree: boolean('is_gluten_free').notNull().default(false),
    ordem: integer('ordem').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('products_tenant_ix').on(t.tenantId),
    categoryOrdemIdx: index('products_category_ordem_ix').on(t.categoryId, t.ordem),
  }),
);

/**
 * product_variants — variações de um produto (P/M/G, 350ml/600ml).
 * Quando o produto tem variants, o totem força o cliente a escolher uma.
 * `isDefault` marca a sugerida; o app garante que no máximo uma variant
 * por produto seja default (server action revoga as outras).
 */
export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    priceCents: integer('price_cents').notNull(),
    isDefault: boolean('is_default').notNull().default(false),
    isAvailable: boolean('is_available').notNull().default(true),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => ({
    productOrdemIdx: index('product_variants_product_ordem_ix').on(t.productId, t.ordem),
  }),
);

/**
 * modifier_groups — agrupamento de modificadores por produto.
 * `selectionType: single` = radio (escolha 1). `multi` = checkboxes.
 * `required` força escolher pelo menos um. `min/maxSelect` limitam escolhas.
 */
export const modifierGroups = pgTable(
  'modifier_groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    selectionType: text('selection_type').notNull().default('single'),
    required: boolean('required').notNull().default(false),
    minSelect: integer('min_select').notNull().default(0),
    maxSelect: integer('max_select'),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => ({
    productOrdemIdx: index('modifier_groups_product_ordem_ix').on(t.productId, t.ordem),
  }),
);

/**
 * modifiers — itens individuais dentro de um group.
 * `priceDeltaCents` é sempre >= 0 (decisão do produto: sem desconto via modifier).
 */
export const modifiers = pgTable(
  'modifiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id')
      .notNull()
      .references(() => modifierGroups.id, { onDelete: 'cascade' }),
    nome: text('nome').notNull(),
    priceDeltaCents: integer('price_delta_cents').notNull().default(0),
    isAvailable: boolean('is_available').notNull().default(true),
    ordem: integer('ordem').notNull().default(0),
  },
  (t) => ({
    groupOrdemIdx: index('modifiers_group_ordem_ix').on(t.groupId, t.ordem),
  }),
);

/**
 * order_events — log append-only de eventos vindos do hub local
 * (POST /api/hub/events). Source of truth pra analytics; nunca alterado.
 * dedupe por event_id (PK).
 */
export const orderEvents = pgTable(
  'order_events',
  {
    eventId: text('event_id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    hubId: uuid('hub_id').references(() => hubs.id, { onDelete: 'set null' }),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull(),
    causedBy: text('caused_by'),
    eventTs: timestamp('event_ts', { withTimezone: true }).notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantTsIdx: index('order_events_tenant_ts_ix').on(t.tenantId, t.eventTs),
    tenantTypeIdx: index('order_events_tenant_type_ix').on(t.tenantId, t.type),
  }),
);

/**
 * orders — view materializada derivada de order_events. Atualizada a cada
 * evento de status (criado/iniciado/pronto/entregue/cancelado). Usada pra
 * timeline e métricas de analytics. Pode ser regenerada do log se preciso.
 */
export const orders = pgTable(
  'orders',
  {
    id: text('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    tableId: text('table_id').notNull(),
    status: text('status').notNull(),
    destino: text('destino').notNull(),
    items: jsonb('items').notNull(),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxaServicoBps: integer('taxa_servico_bps').notNull(),
    taxaServicoCents: integer('taxa_servico_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    obs: text('obs'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    preparoStartedAt: timestamp('preparo_started_at', { withTimezone: true }),
    readyAt: timestamp('ready_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantCreatedIdx: index('orders_tenant_created_ix').on(t.tenantId, t.createdAt),
    tenantStatusIdx: index('orders_tenant_status_ix').on(t.tenantId, t.status),
  }),
);

/**
 * tables — mesas físicas da loja. Sincronizadas pra hub via /api/tables.
 * Status (livre/ocupada) é runtime e fica só no hub.
 */
export const tables = pgTable(
  'tables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    numero: integer('numero').notNull(),
    capacidade: integer('capacidade').notNull().default(4),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('tables_tenant_ix').on(t.tenantId),
    tenantNumeroUx: uniqueIndex('tables_tenant_numero_ux').on(t.tenantId, t.numero),
  }),
);

/* ── NextAuth tables (drizzle adapter) ─────────────────────────────────── */
/* Prop names em snake_case nas auth-tables são exigidos pelo DrizzleAdapter */

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (a) => ({
    pk: primaryKey({ columns: [a.provider, a.providerAccountId] }),
  }),
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => owners.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (vt) => ({
    pk: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

/* ── relations ─────────────────────────────────────────────────────────── */

export const tenantsRelations = relations(tenants, ({ many }) => ({
  owners: many(tenantOwners),
  hubs: many(hubs),
  pairings: many(hubPairings),
}));

export const ownersRelations = relations(owners, ({ many }) => ({
  tenants: many(tenantOwners),
}));

export const tenantOwnersRelations = relations(tenantOwners, ({ one }) => ({
  tenant: one(tenants, { fields: [tenantOwners.tenantId], references: [tenants.id] }),
  owner: one(owners, { fields: [tenantOwners.ownerId], references: [owners.id] }),
}));

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Owner = typeof owners.$inferSelect;
export type Hub = typeof hubs.$inferSelect;
export type HubPairing = typeof hubPairings.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type ModifierGroup = typeof modifierGroups.$inferSelect;
export type Modifier = typeof modifiers.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Table = typeof tables.$inferSelect;
export type NewTable = typeof tables.$inferInsert;
