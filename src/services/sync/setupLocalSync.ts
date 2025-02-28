import { PGlite } from '@electric-sql/pglite';
import { PGliteWorker } from '@electric-sql/pglite/worker';
import { createLogger } from '../../utils/logger';
import { ChangeLogSynchronizer } from './ChangeLogSynchronizer';
import { createTriggerFunctionSQL, generateTriggerSQL, syncedTables } from './local-schema.sql';

// Create a logger
const logger = createLogger({ namespace: 'setupLocalSync' });

/**
 * Setup the local database schema for change tracking
 * Creates the change log table and triggers for each table that needs change tracking
 * 
 * @param db The PGlite or PGliteWorker instance
 * @returns A promise that resolves when setup is complete
 */
export async function setupLocalSyncSchema(db: PGlite | PGliteWorker): Promise<void> {
  logger.info('Setting up local sync schema...');
  
  try {
    // Create the trigger function
    await db.exec(createTriggerFunctionSQL);
    logger.info('Created trigger function');
    
    // Create the change log table using our Drizzle schema
    const createTableSQL = `
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
    `;
    
    await db.exec(createTableSQL);
    logger.info('Created change log table and indices');
    
    // Create triggers for each table
    for (const table of syncedTables) {
      await db.exec(generateTriggerSQL(table));
      logger.info(`Created trigger for ${table} table`);
    }
    
    logger.info('Local sync schema setup complete');
  } catch (error) {
    logger.error('Error setting up local sync schema:', error);
    throw error;
  }
}

/**
 * Initialize the change log synchronizer
 * Sets up the database schema and starts the synchronizer
 * 
 * @param db The PGlite or PGliteWorker instance
 * @returns The ChangeLogSynchronizer instance
 */
export async function initializeChangeLogSync(
  db: PGlite | PGliteWorker
): Promise<ChangeLogSynchronizer> {
  // Set up the schema first
  await setupLocalSyncSchema(db);
  
  // Create and start the synchronizer
  const synchronizer = new ChangeLogSynchronizer(db);
  await synchronizer.start();
  
  return synchronizer;
}

/**
 * Export the tables from local-schema.sql.ts for migrations
 */
export { electricChangeLog } from "./local-schema.sql"; 