CREATE TABLE `tenant_config` (
	`id` text PRIMARY KEY DEFAULT 'singleton' NOT NULL,
	`tenant_id` text NOT NULL,
	`nome` text NOT NULL,
	`brand` text,
	`area` text,
	`since_label` text,
	`hero_image_url` text,
	`wifi_ssid` text,
	`wifi_pass` text,
	`updated_at` integer NOT NULL,
	`synced_at` integer NOT NULL
);
