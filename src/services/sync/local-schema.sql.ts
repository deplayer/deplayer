// Re-export the electric change log schema from drizzle-schemas
export { electricChangeLog } from './drizzle-schemas';

/**
 * SQL for creating indices for the change log table
 */
export const changeLogIndices = `
-- Create indices for faster querying
CREATE INDEX IF NOT EXISTS idx_change_log_synced ON _electric_change_log (synced);
CREATE INDEX IF NOT EXISTS idx_change_log_table_row ON _electric_change_log (table_name, row_id);
`;

/**
 * SQL for creating the trigger function to track table changes
 */
export const createTriggerFunctionSQL = `
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
`;

/**
 * Generate SQL to create a trigger for a specific table
 */
export const generateTriggerSQL = (tableName: string): string => `
-- Create trigger for ${tableName} table
DROP TRIGGER IF EXISTS ${tableName}_changes_trigger ON ${tableName};
CREATE TRIGGER ${tableName}_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON ${tableName}
FOR EACH ROW EXECUTE FUNCTION track_table_changes();
`;

/**
 * List of tables that should be tracked for changes
 */
export const syncedTables = [
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

/**
 * Full SQL script for setting up the change log infrastructure
 */
export const changeLogSetupSQL = `
${createTriggerFunctionSQL}

${changeLogIndices}
`; 