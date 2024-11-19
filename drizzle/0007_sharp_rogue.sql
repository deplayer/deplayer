ALTER TABLE "playlist" ADD COLUMN "createdAt" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "updatedAt" timestamp DEFAULT now() NOT NULL;