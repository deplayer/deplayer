import { PGlite } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { SyncManager, SyncConfig, TableSync, ExtendedPGlite } from "./SyncManager";
import { getStoredSyncSettings, SyncSettings } from "../settings/syncSettings";
import { createLogger } from "../../utils/logger";

const logger = createLogger({ namespace: "createSyncManager" });

// Default table configurations based on the project's schema
const defaultTables: TableSync[] = [
  // Core tables first
  { name: "room", primaryKey: ["id"], critical: true },
  
  // Tables with foreign keys after their dependencies
  { name: "peer", primaryKey: ["id"] },
  { name: "media", primaryKey: ["id"] },
  { name: "artist", primaryKey: ["id"] },
  { name: "queue", primaryKey: ["id"] },
  { name: "smart_playlist", primaryKey: ["id"] },
  { name: "playlist", primaryKey: ["id"] },
  { name: "media_lyrics", primaryKey: ["id"] },
];

export interface CreateSyncManagerOptions {
  /**
   * PGlite client
   */
  client: PGlite | PGliteWorker;
  
  /**
   * Override the default sync settings
   */
  settings?: Partial<SyncSettings>;
  
  /**
   * Override the default table configurations
   */
  tables?: TableSync[];
  
  /**
   * Authentication token for the sync server
   */
  authToken?: string;
  
  /**
   * Reconnect interval in milliseconds
   */
  reconnectInterval?: number;
  
  /**
   * Maximum number of reconnect attempts
   */
  maxReconnectAttempts?: number;
}

/**
 * Create a new SyncManager instance with the provided options
 */
export function createSyncManager(options: CreateSyncManagerOptions): SyncManager {
  const syncSettings = options.settings || getStoredSyncSettings();
  
  const config: SyncConfig = {
    serverUrl: syncSettings.serverUrl || "http://localhost:3000", // Default value if serverUrl is undefined
    enabled: syncSettings.enabled || false, // Default to disabled if undefined
    tables: options.tables || defaultTables,
    authToken: options.authToken,
    reconnectInterval: options.reconnectInterval,
    maxReconnectAttempts: options.maxReconnectAttempts,
  };
  
  logger.debug("Creating SyncManager with config:", {
    serverUrl: config.serverUrl,
    enabled: config.enabled,
    tables: config.tables.map(t => t.name),
    hasAuthToken: !!config.authToken,
  });
  
  return new SyncManager(options.client as ExtendedPGlite, config);
}

/**
 * Helper function to create and automatically start a SyncManager
 */
export async function createAndStartSyncManager(options: CreateSyncManagerOptions): Promise<SyncManager> {
  const syncManager = createSyncManager(options);
  await syncManager.start();
  return syncManager;
} 