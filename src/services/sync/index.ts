/**
 * Sync Module - Entry point for synchronization functionality
 */
export * from './SyncManager';
export * from './ChangeLogSynchronizer';
export * from './setupLocalSync';

// Import types and classes for the factory function
import { SyncManager } from './SyncManager';

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