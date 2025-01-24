-- Create tables for deplayer
CREATE TABLE IF NOT EXISTS "artist" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "bio" text,
  "country" text,
  "lifeSpan" json,
  "relations" json,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "media" (
  "id" text PRIMARY KEY,
  "title" text,
  "artist" json NOT NULL,
  "type" text NOT NULL,
  "album" json NOT NULL,
  "cover" json,
  "stream" json NOT NULL,
  "duration" real NOT NULL,
  "playCount" integer NOT NULL,
  "genres" json,
  "track" integer,
  "year" integer,
  "searchable_text" text NOT NULL DEFAULT '',
  "search_vector" text DEFAULT to_tsvector('english', ''),
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "settings" (
  "id" text PRIMARY KEY,
  "settings" json NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "queue" (
  "id" text PRIMARY KEY,
  "trackIds" json NOT NULL,
  "randomTrackIds" json NOT NULL,
  "currentPlaying" text,
  "repeat" boolean,
  "shuffle" boolean,
  "nextSongId" text,
  "prevSongId" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "smart_playlist" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "filters" json NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "playlist" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "trackIds" json NOT NULL,
  "randomTrackIds" json NOT NULL,
  "currentPlaying" text,
  "repeat" boolean,
  "shuffle" boolean,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "room" (
  "id" text PRIMARY KEY,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "peer" (
  "id" text PRIMARY KEY,
  "roomCode" text NOT NULL REFERENCES "room"("id") ON DELETE CASCADE,
  "username" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "media_lyrics" (
  "id" text PRIMARY KEY,
  "mediaId" text NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
  "lyrics" text NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
); 