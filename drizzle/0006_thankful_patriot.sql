CREATE TABLE IF NOT EXISTS "playlist" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"trackIds" json NOT NULL
);
