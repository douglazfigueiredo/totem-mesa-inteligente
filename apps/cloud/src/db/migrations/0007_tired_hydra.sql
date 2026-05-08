ALTER TABLE "hub_pairings" DROP CONSTRAINT "hub_pairings_consumed_by_hub_id_hubs_id_fk";
--> statement-breakpoint
ALTER TABLE "hub_pairings" DROP CONSTRAINT "hub_pairings_created_by_owner_id_owners_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hub_pairings" ADD CONSTRAINT "hub_pairings_consumed_by_hub_id_hubs_id_fk" FOREIGN KEY ("consumed_by_hub_id") REFERENCES "public"."hubs"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hub_pairings" ADD CONSTRAINT "hub_pairings_created_by_owner_id_owners_id_fk" FOREIGN KEY ("created_by_owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
