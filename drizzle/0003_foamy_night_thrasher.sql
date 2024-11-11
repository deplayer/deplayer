-- Create a temporary column
ALTER TABLE "media" ADD COLUMN "genre_array" json;

-- First convert to arrays for non-null values
UPDATE "media" 
SET "genre_array" = (
  SELECT COALESCE(
    array_to_json(string_to_array(NULLIF(trim("genre"), ''), ',')),
    '[]'::json
  )
);

-- Drop the old column
ALTER TABLE "media" DROP COLUMN "genre";

-- Rename the new column to genre
ALTER TABLE "media" RENAME COLUMN "genre_array" TO "genre"; 