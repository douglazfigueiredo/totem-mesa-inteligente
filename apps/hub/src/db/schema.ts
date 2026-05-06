import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type {
  CatalogSnapshot,
  DeviceRole,
  EmployeeRole,
  ItemCustomization,
  OrderItem,
  OrderStatus,
  PreparoStatus,
  TableStatus,
  TenantFeatures,
  Vertical,
  VerticalConfig,
  WSEventType,
  WaiterCallReason,
  WaiterCallStatus,
} from '@app/schemas';

const ts = (name: string) => integer(name, { mode: 'number' });
const json = <T>(name: string) => text(name, { mode: 'json' }).$type<T>();

export const tenants = sqliteTable(
  'tenants',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    nome: text('nome').notNull(),
    vertical: text('vertical').$type<Vertical>().notNull(),
    features: json<TenantFeatures>('features').notNull(),
    timezone: text('timezone').notNull().default('America/Sao_Paulo'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
  },
  (t) => ({
    slugUx: uniqueIndex('tenants_slug_ux').on(t.slug),
  }),
);

export const tables = sqliteTable(
  'tables',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    numero: integer('numero').notNull(),
    capacidade: integer('capacidade').notNull().default(4),
    status: text('status').$type<TableStatus>().notNull().default('livre'),
    sessionStartedAt: ts('session_started_at'),
  },
  (t) => ({
    tenantNumeroUx: uniqueIndex('tables_tenant_numero_ux').on(t.tenantId, t.numero),
    statusIx: index('tables_status_ix').on(t.status),
  }),
);

export const devices = sqliteTable(
  'devices',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    role: text('role').$type<DeviceRole>().notNull(),
    nome: text('nome').notNull(),
    tableId: text('table_id').references(() => tables.id),
    apiKeyHash: text('api_key_hash').notNull(),
    pairedAt: ts('paired_at').notNull(),
    lastSeenAt: ts('last_seen_at'),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  },
  (t) => ({
    apiKeyHashUx: uniqueIndex('devices_api_key_hash_ux').on(t.apiKeyHash),
    roleIx: index('devices_role_ix').on(t.role),
    tableIx: index('devices_table_ix').on(t.tableId),
  }),
);

export const pairingCodes = sqliteTable(
  'pairing_codes',
  {
    code: text('code').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    role: text('role').$type<DeviceRole>().notNull(),
    expiresAt: ts('expires_at').notNull(),
    consumedAt: ts('consumed_at'),
  },
  (t) => ({
    expiresIx: index('pairing_codes_expires_ix').on(t.expiresAt),
  }),
);

export const employees = sqliteTable(
  'employees',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    nome: text('nome').notNull(),
    pinHash: text('pin_hash').notNull(),
    roles: json<EmployeeRole[]>('roles').notNull(),
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt: ts('created_at').notNull(),
  },
  (t) => ({
    activeIx: index('employees_active_ix').on(t.tenantId, t.isActive),
  }),
);

export const catalogSnapshots = sqliteTable(
  'catalog_snapshots',
  {
    tenantId: text('tenant_id')
      .primaryKey()
      .references(() => tenants.id),
    version: integer('version').notNull(),
    data: json<CatalogSnapshot>('data').notNull(),
    pulledAt: ts('pulled_at').notNull(),
  },
);

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id),
    status: text('status').$type<OrderStatus>().notNull(),
    destino: text('destino').$type<'cozinha' | 'garcom' | 'ambos'>().notNull(),
    items: json<OrderItem[]>('items').notNull(),
    subtotalCents: integer('subtotal_cents').notNull(),
    taxaServicoBps: integer('taxa_servico_bps').notNull().default(1000),
    taxaServicoCents: integer('taxa_servico_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
    obs: text('obs'),
    createdAt: ts('created_at').notNull(),
    sentAt: ts('sent_at'),
    cancelledAt: ts('cancelled_at'),
    cancelReason: text('cancel_reason'),
  },
  (t) => ({
    tableStatusIx: index('orders_table_status_ix').on(t.tableId, t.status),
    statusIx: index('orders_status_ix').on(t.status),
    createdIx: index('orders_created_ix').on(t.createdAt),
  }),
);

export const preparos = sqliteTable(
  'preparos',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    status: text('status').$type<PreparoStatus>().notNull(),
    startedAt: ts('started_at').notNull(),
    durationSec: integer('duration_sec').notNull(),
    startedByEmployeeId: text('started_by_employee_id')
      .notNull()
      .references(() => employees.id),
    readyAt: ts('ready_at'),
    cancelledAt: ts('cancelled_at'),
  },
  (t) => ({
    orderUx: uniqueIndex('preparos_order_ux').on(t.orderId),
    statusIx: index('preparos_status_ix').on(t.status),
    readyDueIx: index('preparos_ready_due_ix').on(t.startedAt, t.durationSec),
  }),
);

export const waiterCalls = sqliteTable(
  'waiter_calls',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    tableId: text('table_id')
      .notNull()
      .references(() => tables.id),
    reason: text('reason').$type<WaiterCallReason>().notNull(),
    obs: text('obs'),
    status: text('status').$type<WaiterCallStatus>().notNull(),
    createdAt: ts('created_at').notNull(),
    acknowledgedBy: text('acknowledged_by').references(() => employees.id),
    acknowledgedAt: ts('acknowledged_at'),
    resolvedAt: ts('resolved_at'),
    escalationLevel: integer('escalation_level').notNull().default(0),
  },
  (t) => ({
    statusIx: index('waiter_calls_status_ix').on(t.status, t.createdAt),
    tableIx: index('waiter_calls_table_ix').on(t.tableId, t.status),
  }),
);

export const eventOutbox = sqliteTable(
  'event_outbox',
  {
    eventId: text('event_id').primaryKey(),
    tenantId: text('tenant_id')
      .notNull()
      .references(() => tenants.id),
    type: text('type').$type<WSEventType>().notNull(),
    payload: json<unknown>('payload').notNull(),
    createdAt: ts('created_at').notNull(),
    sentAt: ts('sent_at'),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
    nextRetryAt: ts('next_retry_at'),
  },
  (t) => ({
    pendingIx: index('event_outbox_pending_ix').on(t.sentAt, t.nextRetryAt),
    tenantCreatedIx: index('event_outbox_tenant_created_ix').on(t.tenantId, t.createdAt),
  }),
);

export const processedEvents = sqliteTable(
  'processed_events',
  {
    eventId: text('event_id').primaryKey(),
    type: text('type').$type<WSEventType>().notNull(),
    deviceId: text('device_id'),
    processedAt: ts('processed_at').notNull(),
    resultJson: text('result_json'),
  },
  (t) => ({
    processedAtIx: index('processed_events_processed_at_ix').on(t.processedAt),
  }),
);

export const heartbeats = sqliteTable(
  'heartbeats',
  {
    deviceId: text('device_id')
      .primaryKey()
      .references(() => devices.id),
    lastPingAt: ts('last_ping_at').notNull(),
    rttMsP95: integer('rtt_ms_p95'),
  },
);

export type DBSchema = {
  tenants: typeof tenants;
  tables: typeof tables;
  devices: typeof devices;
  pairingCodes: typeof pairingCodes;
  employees: typeof employees;
  catalogSnapshots: typeof catalogSnapshots;
  orders: typeof orders;
  preparos: typeof preparos;
  waiterCalls: typeof waiterCalls;
  eventOutbox: typeof eventOutbox;
  processedEvents: typeof processedEvents;
  heartbeats: typeof heartbeats;
};

export const SCHEMA_SQL_FALLBACK = sql`PRAGMA journal_mode = WAL;`;
