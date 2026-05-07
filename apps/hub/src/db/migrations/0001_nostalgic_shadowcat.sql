CREATE TABLE `cloud_link` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`cloud_base_url` text NOT NULL,
	`tenant_id` text NOT NULL,
	`tenant_nome` text NOT NULL,
	`hub_id` text NOT NULL,
	`hub_nome` text NOT NULL,
	`api_key` text NOT NULL,
	`paired_at` integer NOT NULL,
	`last_sync_at` integer,
	`last_sync_version` integer
);
