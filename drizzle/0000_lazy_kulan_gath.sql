CREATE TABLE IF NOT EXISTS "media" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text,
	"artist" json NOT NULL,
	"type" text NOT NULL,
	"album" json NOT NULL,
	"cover" json NOT NULL,
	"stream" json NOT NULL,
	"duration" integer NOT NULL,
	"playCount" integer NOT NULL,
	"genre" text,
	"track" integer,
	"year" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "queue" (
	"id" text PRIMARY KEY NOT NULL,
	"trackIds" json NOT NULL,
	"randomTrackIds" json NOT NULL,
	"currentPlaying" text,
	"repeat" boolean,
	"shuffle" boolean,
	"nextSongId" text,
	"prevSongId" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"settings" json NOT NULL
);
