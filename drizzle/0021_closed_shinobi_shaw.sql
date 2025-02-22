CREATE TABLE IF NOT EXISTS "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"mediaId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "favorites" ADD CONSTRAINT "favorites_mediaId_media_id_fk" FOREIGN KEY ("mediaId") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
