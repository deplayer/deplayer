/**
 * Sync Module - Entry point for synchronization functionality
 */
export * from './SyncManager';
export * from './ChangeLogSynchronizer';
export * from './setupLocalSync';
export * from './drizzle-schemas';
export * from './migrations';

// Import types and classes for the factory function
import { SyncManager, SyncConfig, ExtendedPGlite } from './SyncManager';
import { initializeChangeLogSync } from './setupLocalSync';
import { PGlite } from '@electric-sql/pglite';
import { PGliteWorker } from '@electric-sql/pglite/worker';

/**
 * Factory function to create both a SyncManager and ChangeLogSynchronizer
 * This is the main entry point for setting up synchronization in an application
 */
async function createSyncInfrastructure(
  db: PGlite | PGliteWorker,
  config: SyncConfig
) {
  // Create the sync manager with both the db client and config
  const syncManager = new SyncManager(db as ExtendedPGlite, config);
  
  // Setup the change log synchronizer if sync is enabled
  let changeLogSynchronizer = null;
  if (config.enabled && config.serverUrl) {
    // Initialize the change log sync with just the database
    // It will use authentication from the SyncManager
    changeLogSynchronizer = await initializeChangeLogSync(db);
  }
  
  return {
    syncManager,
    changeLogSynchronizer
  };
}

// Export factory functions
export { createSyncManager,  } from './createSyncManager';;

// Export types from SyncManager;

// Global sync manager instance
let globalSyncManager: SyncManager | null = null;

/**
 * Get the global SyncManager instance
 * @returns The global SyncManager instance or null if not initialized
 */
export function getSyncManager(): SyncManager | null {
  return globalSyncManager;
}

/**
 * Set the global SyncManager instance
 * @param syncManager The SyncManager instance to set globally
 */
export function setSyncManager(syncManager: SyncManager): void {
  globalSyncManager = syncManager;
}

/**
 * Clear the global SyncManager instance
 */
function clearSyncManager(): void {
  globalSyncManager = null;
} 