CREATE TABLE IF NOT EXISTS "order_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"hub_id" uuid,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"caused_by" text,
	"event_ts" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"table_id" text NOT NULL,
	"status" text NOT NULL,
	"destino" text NOT NULL,
	"items" jsonb NOT NULL,
	"subtotal_cents" integer NOT NULL,
	"taxa_servico_bps" integer NOT NULL,
	"taxa_servico_cents" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"obs" text,
	"created_at" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone,
	"preparo_started_at" timestamp with time zone,
	"ready_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_events" ADD CONSTRAINT "order_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_events" ADD CONSTRAINT "order_events_hub_id_hubs_id_fk" FOREIGN KEY ("hub_id") REFERENCES "public"."hubs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "orders" ADD CONSTRAINT "orders_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_tenant_ts_ix" ON "order_events" USING btree ("tenant_id","event_ts");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_tenant_type_ix" ON "order_events" USING btree ("tenant_id","type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tenant_created_ix" ON "orders" USING btree ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_tenant_status_ix" ON "orders" USING btree ("tenant_id","status");