import { PGlite } from "@electric-sql/pglite";
import { PGliteWorker } from "@electric-sql/pglite/worker";
import { drizzle, PgliteDatabase } from "drizzle-orm/pglite";
import {
  getStoredSyncSettings,
  type SyncSettings,
} from "../settings/syncSettings";

import type { MigrationConfig } from "drizzle-orm/migrator";
import migrations from "./migrations.json";
import { createLogger } from "../../utils/logger";

let dbPromise: Promise<PgliteDatabase> | null = null;
let currentClient: PGlite | PGliteWorker | null = null;
let currentWorker: Worker | null = null;

const logger = createLogger({ namespace: "PgliteDatabase" });

type SyncShape = {
  url: string;
  params: {
    table: string;
  };
};

type SyncConfig = {
  shape: SyncShape;
  table: string;
  primaryKey: string[];
};

// Shape subscription types
type ShapeRows = Record<string, any>[];

type ShapeData =
  | {
      rows: ShapeRows;
    }
  | undefined;

type ShapeSubscription = {
  rows: Promise<ShapeRows>;
  subscribe: (callback: (data: ShapeData) => void) => void;
};

type ExtendedPGlite = PGlite & {
  electric: {
    syncShapeToTable: (config: SyncConfig) => ShapeSubscription;
  };
};

export function getClient(): PGlite | PGliteWorker {
  if (process.env.NODE_ENV === "test") {
    return new PGlite();
  } else {
    const worker = new Worker(
      new URL("./pglite.worker.ts", import.meta.url),
      { type: "module" }
    );
    currentWorker = worker;
    const client = new PGliteWorker(worker);
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

async function setupSync(client: PGlite | PGliteWorker, settings: SyncSettings) {
  logger.debug("setupSync settings", settings);

  if (settings.enabled && settings.serverUrl) {
    // Define tables in order of their dependencies
    const tables = [
      // Core tables first
      { name: "settings", primaryKey: ["id"] },
      { name: "room", primaryKey: ["id"] }, // room needs to be before peer

      // Tables with foreign keys
      { name: "peer", primaryKey: ["id"] },
      { name: "media", primaryKey: ["id"] },
      { name: "artist", primaryKey: ["id"] },
      { name: "queue", primaryKey: ["id"] },
      { name: "smart_playlist", primaryKey: ["id"] },
      { name: "playlist", primaryKey: ["id"] },
      { name: "media_lyrics", primaryKey: ["id"] },
    ];

    logger.debug("Preparing shapes for sync", tables);

    // Sync tables sequentially to respect dependencies
    for (const table of tables) {
      try {
        logger.debug(`Setting up sync for table: ${table.name}`);

        // @ts-ignore - Both PGlite and PGliteWorker support electric sync
        const shape = await (client as ExtendedPGlite).electric.syncShapeToTable({
          shape: {
            url: `${settings.serverUrl}/v1/shape`,
            params: {
              table: table.name,
            },
          },
          table: table.name,
          primaryKey: table.primaryKey,
        });

        // Wait for initial data to ensure proper initialization
        try {
          const initialRows = await shape.rows;
          logger.debug(
            `Loaded ${initialRows?.length ?? 0} rows for ${table.name}`
          );
        } catch (error) {
          logger.error(`Error loading initial data for ${table.name}:`, error);
          if (table.name === "settings" || table.name === "room") {
            throw error; // Critical tables should fail fast
          }
        }

        // Set up subscription with error handling
        shape.subscribe((data) => {
          try {
            if (!data) {
              logger.warn(`No rows found for ${table.name}`);
              return;
            }

            const rows = data.rows;
            if (!Array.isArray(rows)) {
              logger.warn(`Invalid rows data for ${table.name}:`, rows);
              return;
            }

            logger.debug(`Loaded ${rows.length} rows for ${table.name}`);
          } catch (error) {
            logger.error("Error during sync:", error);
          }
        });
      } catch (error) {
        logger.error(`Error setting up sync for table ${table.name}:`, error);
        if (table.name === "settings" || table.name === "room") {
          throw error; // Critical tables should fail fast
        }
      }
    }
  } else {
    logger.debug("Sync is disabled or server URL not configured");
  }
}

const _create = async (): Promise<PgliteDatabase> => {
  const client = getClient();
  // @ts-ignore - PGliteWorker is compatible with PGlite for drizzle
  const db: PgliteDatabase = drizzle(client);

  logger.info("pglite object:", db);

  await migrate(db);

  const syncSettings = getStoredSyncSettings();
  await setupSync(client, syncSettings);

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

let db: any = null;

export const getDb = () => {
  return db;
};

export const runMigrations = async () => {
  const db = await reconnect();
  await migrate(db);
  return db;
};

export default {
  getDb,
  reconnect,
  runMigrations,
};
