ALTER TABLE "playlist" ADD COLUMN "randomTrackIds" json NOT NULL;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "currentPlaying" text;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "repeat" boolean;--> statement-breakpoint
ALTER TABLE "playlist" ADD COLUMN "shuffle" boolean;