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

type ExtendedPGlite = PGlite & {
  electric: {
    syncShapeToTable: (config: SyncConfig) => {
      subscribe: (handlers: {
        next: (data: unknown) => void;
        error: (error: unknown) => void;
      }) => void;
    };
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
    const tables = [
      { name: "media", primaryKey: ["id"] },
      { name: "artist", primaryKey: ["id"] },
      { name: "settings", primaryKey: ["id"] },
      { name: "queue", primaryKey: ["id"] },
      { name: "smart_playlist", primaryKey: ["id"] },
      { name: "playlist", primaryKey: ["id"] },
      { name: "peer", primaryKey: ["id"] },
      { name: "room", primaryKey: ["id"] },
      { name: "media_lyrics", primaryKey: ["id"] },
    ];

    console.debug("Preparing shapes for sync", tables);

    for (const table of tables) {
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

      shape.subscribe({
        next: (data) => {
          console.debug("Sync shape to table", data);
        },
        error: (error) => {
          console.error("Error syncing shape to table", error);
        },
      });
    }
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
