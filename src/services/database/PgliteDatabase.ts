import { PGlite } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { electricSync } from "@electric-sql/pglite-sync";
import { drizzle, PgliteDatabase } from "drizzle-orm/pglite";
import {
  getStoredSyncSettings,
  getAuthToken,
  type SyncSettings,
} from "../settings/syncSettings";

import type { MigrationConfig } from "drizzle-orm/migrator";
import migrations from "./migrations.json";
import { createLogger } from "../../utils/logger";
import { createSyncManager, getSyncManager, setSyncManager, SyncManager } from "../sync";
import { initializeChangeLogSync } from "../sync/setupLocalSync";
import { ChangeLogSynchronizer } from "../sync/ChangeLogSynchronizer";

let dbPromise: Promise<PgliteDatabase> | null = null;
let currentClient: PGlite | PGliteWorker | null = null;
let currentWorker: Worker | null = null;
let changeLogSynchronizer: ChangeLogSynchronizer | null = null;

const logger = createLogger({ namespace: "PgliteDatabase" });

function getClient(): PGlite | PGliteWorker {
  if (process.env.NODE_ENV === "test") {
    return new PGlite();
  } else {
    const worker = new Worker(
      new URL("./pglite.worker.ts", import.meta.url),
      { type: "module" }
    );
    currentWorker = worker;
    const client = new PGliteWorker(worker, {
      extensions: {
        electric: electricSync()
      }
    });
    currentClient = client;
    return client;
  }
}

async function migrate(db: any) {
  // dialect and session will appear to not exist...but they do
  await db.dialect.migrate(migrations, db.session, {
    migrationsTable: "drizzle_migrations",
  } satisfies Omit<MigrationConfig, "migrationsFolder">);
}

/**
 * Initialize the sync manager with the given client and settings
 */
async function initializeSyncManager(
  client: PGlite | PGliteWorker, 
  settings: SyncSettings,
  authToken?: string
): Promise<SyncManager> {
  logger.debug("Initializing SyncManager with settings:", {
    enabled: settings.enabled,
    serverUrl: settings.serverUrl,
    hasAuthToken: !!authToken,
  });

  const syncManager = createSyncManager({
    client,
    settings,
    authToken,
  });

  // Store the sync manager globally for easy access
  setSyncManager(syncManager);

  // Start the sync process
  await syncManager.start();

  return syncManager;
}

const _create = async (): Promise<PgliteDatabase> => {
  const client = getClient();
  // @ts-ignore - PGliteWorker is compatible with PGlite for drizzle
  const db: PgliteDatabase = drizzle(client);

  logger.info("pglite object:", db);

  await migrate(db);

  // Initialize sync with stored settings
  const syncSettings = getStoredSyncSettings();
  
  // Get auth token from settings
  const authToken = getAuthToken();
  
  // Initialize the read-path sync manager
  await initializeSyncManager(client, syncSettings, authToken);
  
  // Initialize the write-path sync (change log synchronizer)
  if (syncSettings.enabled && syncSettings.serverUrl) {
    try {
      logger.info("Initializing write-path sync");
      changeLogSynchronizer = await initializeChangeLogSync(client);
      logger.info("Write-path sync initialized successfully");
    } catch (error) {
      logger.error("Error initializing write-path sync:", error);
      // We don't throw here because the app can still function with read-only sync
    }
  }

  return db;
};

export const get = (): Promise<PgliteDatabase> => {
  if (!dbPromise) {
    dbPromise = _create();
  }

  return dbPromise;
};

export const reconnect = async () => {
  if (currentClient) {
    // Close existing connection if possible
    try {
      // Stop the sync manager first
      const syncManager = getSyncManager();
      if (syncManager) {
        await syncManager.stop();
      }
      
      // Stop the change log synchronizer if running
      if (changeLogSynchronizer) {
        logger.info("Stopping change log synchronizer");
        await changeLogSynchronizer.stop();
        changeLogSynchronizer = null;
      }
      
      if (currentWorker) {
        currentWorker.terminate();
        currentWorker = null;
      } else if (currentClient instanceof PGlite) {
        await (currentClient as any).close?.();
      }
    } catch (e) {
      logger.warn("Error closing existing connection:", e);
    }
  }

  // Reset promises and create new connection
  dbPromise = null;
  currentClient = null;
  return get();
};

/**
 * Update sync settings and reconnect if necessary
 */
export const updateSyncSettings = async (settings: SyncSettings, authToken?: string): Promise<void> => {
  const syncManager = getSyncManager();
  
  if (syncManager) {
    // Update the sync manager configuration
    await syncManager.updateConfig({
      serverUrl: settings.serverUrl,
      enabled: settings.enabled,
      authToken,
    });
    
    // If we have a client but no change log synchronizer and sync is now enabled,
    // initialize the change log synchronizer
    if (settings.enabled && currentClient && !changeLogSynchronizer) {
      try {
        logger.info("Initializing write-path sync after settings update");
        changeLogSynchronizer = await initializeChangeLogSync(currentClient);
      } catch (error) {
        logger.error("Error initializing write-path sync after settings update:", error);
      }
    } else if (!settings.enabled && changeLogSynchronizer) {
      // If sync is disabled but we have a change log synchronizer, stop it
      logger.info("Stopping change log synchronizer due to disabled sync");
      await changeLogSynchronizer.stop();
      changeLogSynchronizer = null;
    }
  } else if (settings.enabled) {
    // If there's no sync manager but sync is enabled, reconnect to create one
    await reconnect();
  }
};

/**
 * Get the change log synchronizer
 */
const getChangeLogSynchronizer = (): ChangeLogSynchronizer | null => {
  return changeLogSynchronizer;
};

/**
 * Manually trigger sync for a specific row (useful for critical data)
 */
const syncRow = async (tableName: string, rowId: string): Promise<boolean> => {
  if (!changeLogSynchronizer) {
    return false;
  }
  
  return changeLogSynchronizer.syncRow(tableName, rowId);
};

let db: any = null;

const getDb = () => {
  return db;
};

const runMigrations = async () => {
  const db = await reconnect();
  await migrate(db);
  return db;
};

