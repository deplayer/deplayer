import { sql } from "drizzle-orm";

/**
 * Generate a migration script for setting up the change log table and triggers
 * 
 * This exports a migration that can be used with Drizzle's migration system.
 * Import this in your migration file when you want to add change tracking.
 */
export const changeLogMigration = {
  up: async (db: any) => {
    // Create the change log table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS _electric_change_log (
        id SERIAL PRIMARY KEY,
        table_name TEXT NOT NULL,
        row_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        changes JSONB NOT NULL,
        synced BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        error TEXT
      );
      
      -- Create indices for faster querying
      CREATE INDEX IF NOT EXISTS idx_change_log_synced ON _electric_change_log (synced);
      CREATE INDEX IF NOT EXISTS idx_change_log_table_row ON _electric_change_log (table_name, row_id);
      
      -- Create the trigger function
      CREATE OR REPLACE FUNCTION track_table_changes() RETURNS TRIGGER AS $$
      BEGIN
        IF (TG_OP = 'INSERT') THEN
          INSERT INTO _electric_change_log (table_name, row_id, operation, changes)
          VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb);
        ELSIF (TG_OP = 'UPDATE') THEN
          INSERT INTO _electric_change_log (table_name, row_id, operation, changes)
          VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(NEW)::jsonb);
        ELSIF (TG_OP = 'DELETE') THEN
          INSERT INTO _electric_change_log (table_name, row_id, operation, changes)
          VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb);
        END IF;
        
        -- Notify listeners about the change
        PERFORM pg_notify('electric_changes', json_build_object(
          'table', TG_TABLE_NAME,
          'id', CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
          'operation', TG_OP
        )::text);
        
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    // Add triggers to all tables that need change tracking
    const tables = [
      "room",
      "peer",
      "media",
      "artist",
      "queue",
      "smart_playlist",
      "playlist",
      "media_lyrics",
      "favorites"
    ];
    
    for (const table of tables) {
      await db.execute(sql`
        -- Create trigger for ${sql.raw(table)} table
        DROP TRIGGER IF EXISTS ${sql.raw(`${table}_changes_trigger`)} ON ${sql.raw(table)};
        CREATE TRIGGER ${sql.raw(`${table}_changes_trigger`)}
        AFTER INSERT OR UPDATE OR DELETE ON ${sql.raw(table)}
        FOR EACH ROW EXECUTE FUNCTION track_table_changes();
      `);
    }
  },
  
  down: async (db: any) => {
    // Remove triggers from all tables
    const tables = [
      "room",
      "peer",
      "media",
      "artist",
      "queue",
      "smart_playlist",
      "playlist",
      "media_lyrics",
      "favorites"
    ];
    
    for (const table of tables) {
      await db.execute(sql`
        DROP TRIGGER IF EXISTS ${sql.raw(`${table}_changes_trigger`)} ON ${sql.raw(table)};
      `);
    }
    
    // Drop the trigger function and change log table
    await db.execute(sql`
      DROP FUNCTION IF EXISTS track_table_changes();
      DROP TABLE IF EXISTS _electric_change_log;
    `);
  }
}; 