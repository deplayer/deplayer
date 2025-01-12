ALTER TABLE "media" ADD COLUMN "searchable_text" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "media" ADD COLUMN "search_vector" text DEFAULT to_tsvector('english', '');--> statement-breakpoint
CREATE INDEX media_search_vector_idx ON "media" USING GIN ((search_vector::tsvector));--> statement-breakpoint

-- Create function to update search vector
CREATE OR REPLACE FUNCTION media_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', NEW.searchable_text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint

-- Create trigger to automatically update search vector
CREATE TRIGGER media_search_vector_update
  BEFORE INSERT OR UPDATE ON "media"
  FOR EACH ROW
  EXECUTE FUNCTION media_search_vector_update();--> statement-breakpoint

-- Update existing records
UPDATE "media" 
SET searchable_text = COALESCE(title, '') || ' ' || 
    COALESCE((artist->>'name')::text, '') || ' ' || 
    COALESCE((album->>'name')::text, '');