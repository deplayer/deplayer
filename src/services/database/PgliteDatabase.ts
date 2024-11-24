import { PGlite } from '@electric-sql/pglite'
import { electricSync } from '@electric-sql/pglite-sync'

import { drizzle, PgliteDatabase } from 'drizzle-orm/pglite'

import type { MigrationConfig } from "drizzle-orm/migrator"
import migrations from "./migrations.json"

let dbPromise: Promise<PgliteDatabase> | null = null

const debugLevel = 0

export function getClient(): PGlite {
  if (process.env.NODE_ENV === 'test') {
    return new PGlite()
  } else {
    return new PGlite('idb://deplayer-pglite', { debug: debugLevel, extensions: { electric: electricSync() } })
  }
}

async function migrate(db: any) {
  // dialect and session will appear to not exist...but they do
  await db.dialect.migrate(migrations, db.session, {
    migrationsTable: "drizzle_migrations",
  } satisfies Omit<MigrationConfig, "migrationsFolder">);
}

const _create = async (): Promise<PgliteDatabase> => {
  const client = getClient()
  const db: PgliteDatabase = drizzle(client)

  console.log('pglite object:', db)

  await migrate(db)

  /**
  const BASE_URL = 'http://localhost:8080'

  client.electric.syncShapeToTable({
    url: `${BASE_URL}/v1/shape/media`,
    table: 'media',
    primaryKey: ['id'],
  }) **/

  return db
}

export const get = (): Promise<PgliteDatabase> => {
  if (!dbPromise) {
    dbPromise = _create()
  }

  return dbPromise
}
