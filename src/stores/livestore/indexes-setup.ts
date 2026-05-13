/**
 * Database Indexes Setup
 * 
 * This file sets up critical indexes for performance-critical queries.
 * Indexes dramatically improve filtering, sorting, and join performance.
 */

/**
 * Index setup SQL statements
 * 
 * These indexes optimize the most common query patterns:
 * - Filtering by artistId, albumId, type, genres, providers
 * - Joining media with artists/albums
 * - Favorites lookups
 * - Search queries
 */
export const indexesSetup = `
  -- Media table indexes for filtering and joins
  CREATE INDEX IF NOT EXISTS idx_media_artistId ON media(artistId);
  CREATE INDEX IF NOT EXISTS idx_media_albumId ON media(albumId);
  CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
  CREATE INDEX IF NOT EXISTS idx_media_playCount ON media(playCount DESC);
  CREATE INDEX IF NOT EXISTS idx_media_createdAt ON media(createdAt DESC);
  
  -- Denormalized columns for fast filtering (used by Collection filters)
  CREATE INDEX IF NOT EXISTS idx_media_genresFlat ON media(genresFlat);
  CREATE INDEX IF NOT EXISTS idx_media_providersFlat ON media(providersFlat);
  CREATE INDEX IF NOT EXISTS idx_media_artistName ON media(artistName);
  CREATE INDEX IF NOT EXISTS idx_media_title ON media(title);
  
  -- Compound indexes for common filter combinations
  CREATE INDEX IF NOT EXISTS idx_media_artist_album ON media(artistId, albumId);
  CREATE INDEX IF NOT EXISTS idx_media_artist_type ON media(artistId, type);
  
  -- Album table indexes
  CREATE INDEX IF NOT EXISTS idx_albums_artistId ON albums(artistId);
  CREATE INDEX IF NOT EXISTS idx_albums_name ON albums(name);
  CREATE INDEX IF NOT EXISTS idx_albums_year ON albums(year DESC);
  
  -- Favorites table index for fast lookups
  CREATE INDEX IF NOT EXISTS idx_favorites_mediaId ON favorites(mediaId);
  
  -- Lyrics table index
  CREATE INDEX IF NOT EXISTS idx_lyrics_mediaId ON lyrics(mediaId);
  
  -- Smart playlists table index
  CREATE INDEX IF NOT EXISTS idx_smartPlaylists_name ON smartPlaylists(name);
`;

/**
 * Setup database indexes
 * 
 * Call this function once when the LiveStore instance is ready.
 * This creates all necessary indexes for optimal query performance.
 * 
 * @param store - LiveStore instance with sqliteDbWrapper
 * 
 * @example
 * ```typescript
 * import { setupIndexes } from './indexes-setup'
 * import { useStore } from '@livestore/react'
 * 
 * const { store } = useStore()
 * useEffect(() => {
 *   if (!store?.sqliteDbWrapper) return
 *   setupIndexes(store)
 * }, [store])
 * ```
 */
export const setupIndexes = (store: unknown) => {
  if (!store) {
    throw new Error('[LiveStore] Store is not initialized')
  }

  const storeWithDb = store as { sqliteDbWrapper?: { execute: (sql: string) => void } }
  if (!storeWithDb.sqliteDbWrapper) {
    throw new Error('[LiveStore] Store.sqliteDbWrapper is not available')
  }
  
  // Split into individual CREATE INDEX statements
  const statements = indexesSetup.split(';').flatMap((s: string) => {
    const trimmed = s.trim()
    return trimmed.length > 0 ? [trimmed] : []
})
  
  console.log(`[LiveStore] Creating ${statements.length} database indexes...`)
  
  let successCount = 0
  let skipCount = 0
  
  for (const statement of statements) {
    try {
      // Execute each CREATE INDEX statement
      storeWithDb.sqliteDbWrapper!.execute(statement + ';')
      successCount++
    } catch (error: unknown) {
      // Check if error is due to missing table
      const err = error as { message?: string; cause?: { message?: string } }
      const errorMessage = err?.message || err?.cause?.message || String(error)
      if (errorMessage.includes('no such table')) {
        // Extract table name from error for logging
        const tableMatch = errorMessage.match(/table: (?:main\.)?(\w+)/)
        const tableName = tableMatch ? tableMatch[1] : 'unknown'
        console.log(`[LiveStore] Skipping index creation for non-existent table: ${tableName}`)
        skipCount++
      } else {
        // Log other errors but don't stop - indexes are optional for performance
        console.warn('[LiveStore] Failed to create index (non-critical):', errorMessage)
        skipCount++
      }
    }
  }
  
  console.log(`[LiveStore] Database indexes created: ${successCount} successful, ${skipCount} skipped`)
}
