CREATE TABLE IF NOT EXISTS "peer" (
	"id" text PRIMARY KEY NOT NULL,
	"roomCode" text NOT NULL,
	"username" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
