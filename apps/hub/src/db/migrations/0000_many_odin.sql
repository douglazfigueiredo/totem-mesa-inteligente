CREATE TABLE `catalog_snapshots` (
	`tenant_id` text PRIMARY KEY NOT NULL,
	`version` integer NOT NULL,
	`data` text NOT NULL,
	`pulled_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`role` text NOT NULL,
	`nome` text NOT NULL,
	`table_id` text,
	`api_key_hash` text NOT NULL,
	`paired_at` integer NOT NULL,
	`last_seen_at` integer,
	`is_active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `devices_api_key_hash_ux` ON `devices` (`api_key_hash`);--> statement-breakpoint
CREATE INDEX `devices_role_ix` ON `devices` (`role`);--> statement-breakpoint
CREATE INDEX `devices_table_ix` ON `devices` (`table_id`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`nome` text NOT NULL,
	`pin_hash` text NOT NULL,
	`roles` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `employees_active_ix` ON `employees` (`tenant_id`,`is_active`);--> statement-breakpoint
CREATE TABLE `event_outbox` (
	`event_id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`next_retry_at` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `event_outbox_pending_ix` ON `event_outbox` (`sent_at`,`next_retry_at`);--> statement-breakpoint
CREATE INDEX `event_outbox_tenant_created_ix` ON `event_outbox` (`tenant_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `heartbeats` (
	`device_id` text PRIMARY KEY NOT NULL,
	`last_ping_at` integer NOT NULL,
	`rtt_ms_p95` integer,
	FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`table_id` text NOT NULL,
	`status` text NOT NULL,
	`destino` text NOT NULL,
	`items` text NOT NULL,
	`subtotal_cents` integer NOT NULL,
	`taxa_servico_bps` integer DEFAULT 1000 NOT NULL,
	`taxa_servico_cents` integer DEFAULT 0 NOT NULL,
	`total_cents` integer NOT NULL,
	`obs` text,
	`created_at` integer NOT NULL,
	`sent_at` integer,
	`cancelled_at` integer,
	`cancel_reason` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `orders_table_status_ix` ON `orders` (`table_id`,`status`);--> statement-breakpoint
CREATE INDEX `orders_status_ix` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_created_ix` ON `orders` (`created_at`);--> statement-breakpoint
CREATE TABLE `pairing_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`role` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `pairing_codes_expires_ix` ON `pairing_codes` (`expires_at`);--> statement-breakpoint
CREATE TABLE `preparos` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`duration_sec` integer NOT NULL,
	`started_by_employee_id` text NOT NULL,
	`ready_at` integer,
	`cancelled_at` integer,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`started_by_employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `preparos_order_ux` ON `preparos` (`order_id`);--> statement-breakpoint
CREATE INDEX `preparos_status_ix` ON `preparos` (`status`);--> statement-breakpoint
CREATE INDEX `preparos_ready_due_ix` ON `preparos` (`started_at`,`duration_sec`);--> statement-breakpoint
CREATE TABLE `processed_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`device_id` text,
	`processed_at` integer NOT NULL,
	`result_json` text
);
--> statement-breakpoint
CREATE INDEX `processed_events_processed_at_ix` ON `processed_events` (`processed_at`);--> statement-breakpoint
CREATE TABLE `tables` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`numero` integer NOT NULL,
	`capacidade` integer DEFAULT 4 NOT NULL,
	`status` text DEFAULT 'livre' NOT NULL,
	`session_started_at` integer,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tables_tenant_numero_ux` ON `tables` (`tenant_id`,`numero`);--> statement-breakpoint
CREATE INDEX `tables_status_ix` ON `tables` (`status`);--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`nome` text NOT NULL,
	`vertical` text NOT NULL,
	`features` text NOT NULL,
	`timezone` text DEFAULT 'America/Sao_Paulo' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tenants_slug_ux` ON `tenants` (`slug`);--> statement-breakpoint
CREATE TABLE `waiter_calls` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`table_id` text NOT NULL,
	`reason` text NOT NULL,
	`obs` text,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`acknowledged_by` text,
	`acknowledged_at` integer,
	`resolved_at` integer,
	`escalation_level` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`acknowledged_by`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `waiter_calls_status_ix` ON `waiter_calls` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `waiter_calls_table_ix` ON `waiter_calls` (`table_id`,`status`);