/**
 * Full-Text Search (FTS5) Configuration
 * 
 * This file sets up FTS5 virtual tables for fast text search across media library.
 * FTS5 is a SQLite extension that provides advanced full-text search capabilities.
 * 
 * @see https://www.sqlite.org/fts5.html
 */

/**
 * FTS5 setup for media search
 * 
 * Creates a virtual table that indexes media titles, artist names, and album names
 * for fast full-text search.
 * 
 * Usage in queries:
 * ```sql
 * SELECT media.* FROM media
 * JOIN media_fts ON media.id = media_fts.rowid
 * WHERE media_fts MATCH 'search terms'
 * ORDER BY media_fts.rank
 * ```
 */
export const mediaFtsSetup = `
  -- Create FTS5 virtual table for media search
  CREATE VIRTUAL TABLE IF NOT EXISTS media_fts USING fts5(
    title,
    artist_name,
    album_name,
    genres,
    content='media',
    content_rowid='rowid'
  );

  -- Trigger to keep FTS index in sync when media is inserted
  CREATE TRIGGER IF NOT EXISTS media_fts_insert AFTER INSERT ON media BEGIN
    INSERT INTO media_fts(rowid, title, artist_name, album_name, genres)
    SELECT 
      NEW.rowid,
      NEW.title,
      (SELECT name FROM artists WHERE id = NEW.artistId),
      (SELECT name FROM albums WHERE id = NEW.albumId),
      json_extract(NEW.genres, '$')
    ;
  END;

  -- Trigger to keep FTS index in sync when media is updated
  CREATE TRIGGER IF NOT EXISTS media_fts_update AFTER UPDATE ON media BEGIN
    UPDATE media_fts 
    SET 
      title = NEW.title,
      artist_name = (SELECT name FROM artists WHERE id = NEW.artistId),
      album_name = (SELECT name FROM albums WHERE id = NEW.albumId),
      genres = json_extract(NEW.genres, '$')
    WHERE rowid = NEW.rowid;
  END;

  -- Trigger to keep FTS index in sync when media is deleted
  CREATE TRIGGER IF NOT EXISTS media_fts_delete AFTER DELETE ON media BEGIN
    DELETE FROM media_fts WHERE rowid = OLD.rowid;
  END;
`;

/**
 * FTS5 setup for artist search
 */
export const artistFtsSetup = `
  CREATE VIRTUAL TABLE IF NOT EXISTS artists_fts USING fts5(
    name,
    content='artists',
    content_rowid='rowid'
  );

  CREATE TRIGGER IF NOT EXISTS artists_fts_insert AFTER INSERT ON artists BEGIN
    INSERT INTO artists_fts(rowid, name) VALUES (NEW.rowid, NEW.name);
  END;

  CREATE TRIGGER IF NOT EXISTS artists_fts_update AFTER UPDATE ON artists BEGIN
    UPDATE artists_fts SET name = NEW.name WHERE rowid = NEW.rowid;
  END;

  CREATE TRIGGER IF NOT EXISTS artists_fts_delete AFTER DELETE ON artists BEGIN
    DELETE FROM artists_fts WHERE rowid = OLD.rowid;
  END;
`;

/**
 * FTS5 setup for album search
 */
export const albumFtsSetup = `
  CREATE VIRTUAL TABLE IF NOT EXISTS albums_fts USING fts5(
    name,
    artist_name,
    content='albums',
    content_rowid='rowid'
  );

  CREATE TRIGGER IF NOT EXISTS albums_fts_insert AFTER INSERT ON albums BEGIN
    INSERT INTO albums_fts(rowid, name, artist_name)
    SELECT NEW.rowid, NEW.name, artists.name
    FROM artists WHERE artists.id = NEW.artistId;
  END;

  CREATE TRIGGER IF NOT EXISTS albums_fts_update AFTER UPDATE ON albums BEGIN
    UPDATE albums_fts 
    SET 
      name = NEW.name,
      artist_name = (SELECT name FROM artists WHERE id = NEW.artistId)
    WHERE rowid = NEW.rowid;
  END;

  CREATE TRIGGER IF NOT EXISTS albums_fts_delete AFTER DELETE ON albums BEGIN
    DELETE FROM albums_fts WHERE rowid = OLD.rowid;
  END;
`;

/**
 * FTS5 setup for playlist search
 */
export const playlistFtsSetup = `
  CREATE VIRTUAL TABLE IF NOT EXISTS playlists_fts USING fts5(
    name,
    content='playlists',
    content_rowid='rowid'
  );

  CREATE TRIGGER IF NOT EXISTS playlists_fts_insert AFTER INSERT ON playlists BEGIN
    INSERT INTO playlists_fts(rowid, name) VALUES (NEW.rowid, NEW.name);
  END;

  CREATE TRIGGER IF NOT EXISTS playlists_fts_update AFTER UPDATE ON playlists BEGIN
    UPDATE playlists_fts SET name = NEW.name WHERE rowid = NEW.rowid;
  END;

  CREATE TRIGGER IF NOT EXISTS playlists_fts_delete AFTER DELETE ON playlists BEGIN
    DELETE FROM playlists_fts WHERE rowid = OLD.rowid;
  END;
`;

/**
 * Combined FTS5 setup - run all setup queries
 */
export const allFtsSetup = [
  mediaFtsSetup,
  artistFtsSetup,
  albumFtsSetup,
  playlistFtsSetup,
].join('\n\n');

/**
 * Helper function to execute FTS setup
 * This should be called once when the store is initialized
 * 
 * @example
 * ```typescript
 * import { allFtsSetup } from './fts5-setup'
 * 
 * // After store initialization
 * await store.exec(allFtsSetup)
 * ```
 */
export const setupFts5 = async (store: any) => {
  try {
    // Execute all FTS5 setup queries
    await store.exec(allFtsSetup)
    console.log('[LiveStore] FTS5 search tables initialized')
  } catch (error) {
    console.error('[LiveStore] Failed to initialize FTS5:', error)
    throw error
  }
}

/**
 * Search query builder helpers
 */
export const searchQueries = {
  /**
   * Search media by title, artist, or album
   */
  searchMedia: () => `
    SELECT media.*, media_fts.rank
    FROM media
    JOIN media_fts ON media.rowid = media_fts.rowid
    WHERE media_fts MATCH ?
    ORDER BY media_fts.rank
    LIMIT 100
  `,

  /**
   * Search artists by name
   */
  searchArtists: () => `
    SELECT artists.*, artists_fts.rank
    FROM artists
    JOIN artists_fts ON artists.rowid = artists_fts.rowid
    WHERE artists_fts MATCH ?
    ORDER BY artists_fts.rank
    LIMIT 50
  `,

  /**
   * Search albums by name or artist
   */
  searchAlbums: () => `
    SELECT albums.*, albums_fts.rank
    FROM albums
    JOIN albums_fts ON albums.rowid = albums_fts.rowid
    WHERE albums_fts MATCH ?
    ORDER BY albums_fts.rank
    LIMIT 50
  `,

  /**
   * Search playlists by name
   */
  searchPlaylists: () => `
    SELECT playlists.*, playlists_fts.rank
    FROM playlists
    JOIN playlists_fts ON playlists.rowid = playlists_fts.rowid
    WHERE playlists_fts MATCH ?
    ORDER BY playlists_fts.rank
    LIMIT 50
  `,
}
