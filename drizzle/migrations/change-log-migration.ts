import { changeLogMigration } from '../../src/services/sync/migrations';

/**
 * Migration to create the _electric_change_log table and triggers
 * 
 * This migration ensures that changes to tables in the database are tracked
 * for synchronization with the server.
 */
export const up = changeLogMigration.up;
export const down = changeLogMigration.down; 