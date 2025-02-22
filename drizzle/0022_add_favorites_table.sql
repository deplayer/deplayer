-- Create favorites table
CREATE TABLE IF NOT EXISTS "favorites" (
  "id" text PRIMARY KEY,
  "mediaId" text NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "favorites_mediaId_idx" ON "favorites"("mediaId");

-- Create index for faster sorting by creation date
CREATE INDEX IF NOT EXISTS "favorites_createdAt_idx" ON "favorites"("createdAt"); 