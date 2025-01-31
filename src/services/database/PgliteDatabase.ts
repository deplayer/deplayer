import { PGlite } from "@electric-sql/pglite";
import { electricSync } from "@electric-sql/pglite-sync";
import { drizzle, PgliteDatabase } from "drizzle-orm/pglite";
import {
  getStoredSyncSettings,
  type SyncSettings,
} from "../settings/syncSettings";

import type { MigrationConfig } from "drizzle-orm/migrator";
import migrations from "./migrations.json";

let dbPromise: Promise<PgliteDatabase> | null = null;
let currentClient: PGlite | null = null;

const debugLevel = 0;

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

export function getClient(): PGlite {
  if (process.env.NODE_ENV === "test") {
    return new PGlite();
  } else {
    const client = new PGlite("idb://deplayer-pglite", {
      debug: debugLevel,
      extensions: { electric: electricSync() },
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

async function setupSync(client: PGlite, settings: SyncSettings) {
  console.debug("setupSync settings", settings);

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

    console.debug("Preparing shapes for sync", tables);

    // Sync tables sequentially to respect dependencies
    for (const table of tables) {
      try {
        console.debug(`Setting up sync for table: ${table.name}`);

        const shape = await (
          client as ExtendedPGlite
        ).electric.syncShapeToTable({
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
          console.debug(
            `Initial data loaded for ${table.name}: ${
              initialRows?.length ?? 0
            } rows`
          );
        } catch (error) {
          console.error(`Error loading initial data for ${table.name}:`, error);
          if (table.name === "settings" || table.name === "room") {
            throw error; // Critical tables should fail fast
          }
        }

        // Set up subscription with error handling
        shape.subscribe((data) => {
          try {
            if (!data) {
              console.warn(
                `Received undefined data in sync update for ${table.name}`
              );
              return;
            }

            const rows = data.rows;
            if (!Array.isArray(rows)) {
              console.warn(`Invalid rows data for ${table.name}:`, rows);
              return;
            }

            console.debug(
              `Received sync update for ${table.name}: ${rows.length} rows`
            );
          } catch (error) {
            console.error(
              `Error processing sync update for ${table.name}:`,
              error
            );
          }
        });
      } catch (error) {
        console.error(`Error setting up sync for table ${table.name}:`, error);
        if (table.name === "settings" || table.name === "room") {
          throw error; // Critical tables should fail fast
        }
      }
    }
  } else {
    console.debug("Sync is disabled or server URL not configured");
  }
}

const _create = async (): Promise<PgliteDatabase> => {
  const client = getClient();
  const db: PgliteDatabase = drizzle(client);

  console.log("pglite object:", db);

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
      await (currentClient as any).close?.();
    } catch (e) {
      console.warn("Error closing existing connection:", e);
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
