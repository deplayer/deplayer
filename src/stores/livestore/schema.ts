// ============================================================================
// SCHEMA VERSION HISTORY
// ============================================================================
// v0.6  (2026-09-21) Normalized the playback queue: track lists moved from
//         the queue row's JSON cells into queue_items (one row per track per
//         list), making advance navigation O(1). The schema hash change
//         triggers eventlog rematerialization, which rebuilds queue_items
//         from existing QueueUpdated events (event shapes unchanged).
// v0.5  (2026-07-17) Moved performance-critical indexes to declarative table
//         definitions. Removed boot-time index/backfill setup.
// v0.4  (2026-07-13) Added media_genres indexed read model table.
//         - Maintained by media materializers (normalizeGenreRows helper).
//         - Replaces unbounded genre-to-track-ID map allocations in useGenres
//           and useCollectionData that caused V8 OOM during provider sync.
// v0.3  Added playback_history table (decoupled from media to avoid reactive cascade).
// v0.2  Initial LiveStore schema migration.
import { makeSchema, State } from '@livestore/livestore'
// Import event definitions
import { mediaEvents } from './events/media'
import { playlistEvents } from './events/playlist'
import { smartPlaylistEvents } from './events/smartPlaylist'
import { queueEvents } from './events/queue'
import { favoriteEvents } from './events/favorites'
import { lyricsEvents } from './events/lyrics'
import { settingsEvents } from './events/settings'
import { syncEvents } from './events/sync'
import { deriveCurrentTrackId } from './queue'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// Settings structure types
type ProviderSettings = {
  enabled: boolean;
  [key: string]: unknown;
};

type AppSettings = {
  spectrum?: {
    enabled: boolean;
  };
  lastfm?: {
    enabled: boolean;
    apikey: string;
  };
  language?: {
    code: string;
    useSystemLanguage: boolean;
  };
  notifications?: {
    enabled: boolean;
    showTrackChanges: boolean;
    showErrors: boolean;
  };
  sync?: {
    enabled: boolean;
    serverUrl: string;
    [key: string]: unknown;
  };
};

type SettingsData = {
  providers: {
    [key: string]: ProviderSettings;
  };
  app: AppSettings;
};

// ============================================================================
// SQLITE TABLES
// ============================================================================

export const tables = {
  // Settings table
  settings: State.SQLite.table({
    name: 'settings',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      settings: State.SQLite.json<SettingsData>({}),
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
  }),

  // Artists table (normalized)
  artists: State.SQLite.table({
    name: 'artists',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({}),
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
  }),

  // Albums table (normalized)
  albums: State.SQLite.table({
    name: 'albums',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({}),
      artistId: State.SQLite.text({}),
      thumbnailUrl: State.SQLite.text({ nullable: true }),
      year: State.SQLite.integer({ nullable: true }),
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_albums_artistId', columns: ['artistId'] },
      { name: 'idx_albums_name', columns: ['name'] },
      { name: 'idx_albums_year', columns: ['year'] },
    ],
  }),

  // Media table (tracks)
  media: State.SQLite.table({
    name: 'media',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      title: State.SQLite.text({}),
      artistId: State.SQLite.text({}),
      albumId: State.SQLite.text({}),
      type: State.SQLite.text({}), // 'audio' | 'video'
      duration: State.SQLite.integer({ nullable: true }),
      playCount: State.SQLite.integer({ default: 0 }),
      track: State.SQLite.integer({ nullable: true }),
      discNumber: State.SQLite.integer({ nullable: true }),
      stream: State.SQLite.json({}),
      cover: State.SQLite.json({ nullable: true }),
      genres: State.SQLite.json({}),
      externalId: State.SQLite.text({ nullable: true }),
      shareUrl: State.SQLite.text({ nullable: true }),
      filePath: State.SQLite.text({ nullable: true }),
      // Denormalized columns for fast queries
      artistName: State.SQLite.text({ default: '' }),
      albumName: State.SQLite.text({ default: '' }),
      genresFlat: State.SQLite.text({ default: '' }), // Comma-separated genres
      providersFlat: State.SQLite.text({ default: '' }), // Comma-separated providers
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_media_artistId', columns: ['artistId'] },
      { name: 'idx_media_albumId', columns: ['albumId'] },
      { name: 'idx_media_type', columns: ['type'] },
      { name: 'idx_media_playCount', columns: ['playCount'] },
      { name: 'idx_media_createdAt', columns: ['createdAt'] },
      { name: 'idx_media_genresFlat', columns: ['genresFlat'] },
      { name: 'idx_media_providersFlat', columns: ['providersFlat'] },
      { name: 'idx_media_artistName', columns: ['artistName'] },
      { name: 'idx_media_title', columns: ['title'] },
      { name: 'idx_media_artist_album', columns: ['artistId', 'albumId'] },
      { name: 'idx_media_artist_type', columns: ['artistId', 'type'] },
    ],
  }),
  // Media-genre join table (indexed read model for genre queries)
  mediaGenres: State.SQLite.table({
    name: 'media_genres',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      mediaId: State.SQLite.text({}),
      genre: State.SQLite.text({}),
      createdAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_media_genres_genre', columns: ['genre'] },
      { name: 'idx_media_genres_mediaId', columns: ['mediaId'] },
    ],
  }),
  // Playlists table
  playlists: State.SQLite.table({
    name: 'playlists',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({}),
      trackIds: State.SQLite.json({ default: [] }),
      shuffle: State.SQLite.boolean({ default: false }),
      repeat: State.SQLite.boolean({ default: false }),
      currentPlaying: State.SQLite.integer({ nullable: true }),
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
  }),

  // Queue table (head row only — track lists live in queue_items)
  queue: State.SQLite.table({
    name: 'queue',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      currentPlaying: State.SQLite.integer({ nullable: true }),
      currentTrackId: State.SQLite.text({ nullable: true }),
      shuffle: State.SQLite.boolean({ default: false }),
      repeat: State.SQLite.boolean({ default: false }),
      updatedAt: State.SQLite.integer({}),
    },
  }),

  // Queue item rows: one row per track per list (position = 0-based index)
  queueItems: State.SQLite.table({
    name: 'queue_items',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      queueId: State.SQLite.text({}),
      list: State.SQLite.text({}),
      position: State.SQLite.integer({}),
      trackId: State.SQLite.text({}),
    },
    indexes: [
      { name: 'idx_queue_items_queue_list_position', columns: ['queueId', 'list', 'position'] },
      { name: 'idx_queue_items_queue_list_trackId', columns: ['queueId', 'list', 'trackId'] },
    ],
  }),

  // Favorites table
  favorites: State.SQLite.table({
    name: 'favorites',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      mediaId: State.SQLite.text({}),
      createdAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_favorites_mediaId', columns: ['mediaId'] },
    ],
  }),

  // Lyrics table
  lyrics: State.SQLite.table({
    name: 'media_lyrics',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      mediaId: State.SQLite.text({}),
      lyricsText: State.SQLite.text({}),
      source: State.SQLite.text({ nullable: true }),
      createdAt: State.SQLite.integer({}),
      updatedAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_lyrics_mediaId', columns: ['mediaId'] },
    ],
  }),

  // Smart Playlists table
  smartPlaylists: State.SQLite.table({
    name: 'smart_playlists',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      name: State.SQLite.text({}),
      filters: State.SQLite.json({}), // { genres: [], types: [], artists: [], providers: [] }
      createdAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_smartPlaylists_name', columns: ['name'] },
    ],
  }),

  // Playback history table (decoupled from media table to avoid reactive cascade)
  playbackHistory: State.SQLite.table({
    name: 'playback_history',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      mediaId: State.SQLite.text({}),
      playedAt: State.SQLite.integer({}),
    },
    indexes: [
      { name: 'idx_playback_history_played_at', columns: ['playedAt'] },
    ],
  }),

  // Sync State table (tracks incremental sync progress)
  syncState: State.SQLite.table({
    name: 'sync_state',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      lastSyncTimestamp: State.SQLite.text({ default: '' }),
      lastKnownCount: State.SQLite.integer({ default: 0 }),
      initialSyncCursor: State.SQLite.integer({ default: 0 }),
      initialSyncComplete: State.SQLite.boolean({ default: false }),
      cursorPageSize: State.SQLite.integer({ default: 0 }),
      updatedAt: State.SQLite.integer({}),
    },
  }),
}

// ============================================================================
// EVENTS - Combining all domain events
// ============================================================================

export const events = {
  ...settingsEvents,
  ...mediaEvents,
  ...playlistEvents,
  ...smartPlaylistEvents,
  ...queueEvents,
  ...favoriteEvents,
  ...lyricsEvents,
  ...syncEvents,
}

// ============================================================================
// MATERIALIZERS - Map events to SQLite operations
// ============================================================================

// Normalize genre array into media_genres insert-or-ignore operations.
const normalizeGenreRows = (mediaId: string, genres: readonly string[] | undefined, now: number) =>
  Array.from(new Set((Array.isArray(genres) ? genres : [])
    .map((genre) => genre.trim())
    .filter(Boolean)))
    .map((genre) =>
      tables.mediaGenres
        .insert({
          id: JSON.stringify([mediaId, genre]),
          mediaId,
          genre,
          createdAt: now,
        })
        .onConflict('id', 'ignore'),
    )
// Shared upsert for sync resume state rows (see services/SyncResumeState.ts).
// v1 events predate per-provider cursor geometry; they replay with
// cursorPageSize 0 ("unknown"), which the geometry guard treats as
// "re-derive the cursor once".
const syncStateUpsert = (id: string, s: { lastSyncTimestamp: string; lastKnownCount: number; initialSyncCursor: number; initialSyncComplete: boolean; cursorPageSize: number }) => {
  const now = Date.now()
  return tables.syncState
    .insert({ id, ...s, updatedAt: now })
    .onConflict('id', 'update', { ...s, updatedAt: now })
}

const materializers = State.SQLite.materializers(events, {
  // Settings materializers
  'v1.SettingsUpdated': ({ id, settings: rawSettings }: { id: string; settings: unknown }) => {
    const now = Date.now()
    const settings = rawSettings as SettingsData
    return tables.settings
      .insert({ id, settings, createdAt: now, updatedAt: now })
      .onConflict('id', 'update', { settings, updatedAt: now })
  },

  'v1.SettingsInitialized': ({ id, settings: rawSettings }: { id: string; settings: unknown }) => {
    const now = Date.now()
    const settings = rawSettings as SettingsData
    return tables.settings
      .insert({ id, settings, createdAt: now, updatedAt: now })
      .onConflict('id', 'update', { settings, updatedAt: now })
  },

  // Media materializers
  'v1.MediaAdded': (event: { readonly id: string; readonly title: string; readonly artist: { readonly id: string; readonly name: string }; readonly album: { readonly id: string; readonly name: string; readonly artistId: string; readonly thumbnailUrl?: string; readonly year?: number }; readonly type: string; readonly duration?: number; readonly track?: number; readonly discNumber?: number; readonly stream: unknown; readonly cover?: unknown; readonly genres: readonly string[]; readonly externalId?: string; readonly shareUrl?: string; readonly filePath?: string }) => {
    const now = Date.now()
    const { id, title, artist, album, type, duration, track, discNumber, stream, cover, genres, externalId, shareUrl, filePath } = event
    
    // Compute denormalized fields for fast queries
    const genresFlat = Array.isArray(genres) ? genres.join(',') : ''
    const providersFlat = stream ? Object.keys(stream).join(',') : ''
    
    // Return array of operations: insert artist, insert album, insert media
    return [
      // Insert artist if not exists
      tables.artists
        .insert({
          id: artist.id,
          name: artist.name,
          createdAt: now,
          updatedAt: now,
        })
        .onConflict('id', 'ignore'),
      
      // Insert album if not exists
      tables.albums
        .insert({
          id: album.id,
          name: album.name,
          artistId: album.artistId,
          thumbnailUrl: album.thumbnailUrl ?? null,
          year: album.year ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflict('id', 'ignore'),
      
      // Insert media with denormalized fields
      tables.media
        .insert({
          id,
          title,
          artistId: artist.id,
          albumId: album.id,
          type,
          duration: duration ?? null,
          playCount: 0,
          track: track ?? null,
          discNumber: discNumber ?? null,
          stream,
          cover: cover ?? null,
          genres,
          externalId: externalId ?? null,
          shareUrl: shareUrl ?? null,
          filePath: filePath ?? null,
          artistName: artist.name,
          albumName: album.name,
          genresFlat,
          providersFlat,
          createdAt: now,
          updatedAt: now,
        })
        .onConflict('id', 'update', {
          title,
          artistId: artist.id,
          albumId: album.id,
          type,
          duration: duration ?? null,
          track: track ?? null,
          discNumber: discNumber ?? null,
          stream,
          cover: cover ?? null,
          genres,
          externalId: externalId ?? null,
          shareUrl: shareUrl ?? null,
          filePath: filePath ?? null,
          artistName: artist.name,
          albumName: album.name,
          genresFlat,
          providersFlat,
          updatedAt: now,
        }),
      ...normalizeGenreRows(id, genres, now),
    ]
  },

  'v1.MediaUpdated': ({ id, title, duration, stream, cover, genres }: { readonly id: string; readonly title?: string; readonly duration?: number; readonly stream?: unknown; readonly cover?: unknown; readonly genres?: readonly string[] }) => {
    const now = Date.now()
    const updates: Record<string, unknown> = { updatedAt: now }
    if (title !== undefined) updates.title = title
    if (duration !== undefined) updates.duration = duration
    if (stream !== undefined) {
      updates.stream = stream
      // Update denormalized providers
      updates.providersFlat = stream ? Object.keys(stream).join(',') : ''
    }
    if (cover !== undefined) updates.cover = cover
    if (genres !== undefined) {
      updates.genres = genres
      // Update denormalized genres
      updates.genresFlat = Array.isArray(genres) ? genres.join(',') : ''
    }

    const mediaUpdate = tables.media.update(updates).where('id', '=', id)
    if (genres === undefined) return mediaUpdate
    return [
      mediaUpdate,
      tables.mediaGenres.delete().where('mediaId', '=', id),
      ...normalizeGenreRows(id, genres, now),
    ]
  },

  'v1.MediaPlayed': ({ id }: { id: string }) => {
    // Write to a separate table to avoid invalidating all media-table reactive queries.
    // Previously this updated media.updatedAt, which caused a full reactive cascade
    // across all 49+ hooks subscribed to the media table (O(4K) re-renders per play event).
    const now = Date.now()
    // Suffix random component to avoid PK collisions on rapid successive plays (same ms).
    const rowId = `${id}-${now}-${Math.random().toString(36).slice(2, 8)}`
    return tables.playbackHistory
      .insert({ id: rowId, mediaId: id, playedAt: now })
  },

  'v1.MediaBulkAdded': ((event: { readonly media: readonly { readonly id: string; readonly title: string; readonly artist: { readonly id: string; readonly name: string }; readonly album: { readonly id: string; readonly name: string; readonly artistId: string; readonly thumbnailUrl?: string; readonly year?: number }; readonly type: string; readonly duration?: number; readonly track?: number; readonly discNumber?: number; readonly stream: unknown; readonly cover?: unknown; readonly genres: readonly string[]; readonly externalId?: string; readonly shareUrl?: string; readonly filePath?: string }[] }) => {
    const now = Date.now()
    const operations: unknown[] = []
    
    // PERFORMANCE OPTIMIZATION: Pre-deduplicate artists and albums
    // Instead of inserting 3 ops per media item (artist + album + media),
    // we collect unique artists/albums first, reducing total operations by ~60%
    // Example: 500 songs from 10 artists, 50 albums
    //   Before: 500 + 500 + 500 = 1,500 operations
    //   After:  10 + 50 + 500 = 560 operations
    
    const uniqueArtists = new Map<string, { id: string; name: string }>()
    const uniqueAlbums = new Map<string, { id: string; name: string; artistId: string; thumbnailUrl: string | null; year: number | null }>()
    
    // First pass: collect unique artists and albums
    for (const item of event.media) {
      const artistId = item.artist.id
      const albumId = item.album.id
      if (!uniqueArtists.has(artistId)) {
        uniqueArtists.set(artistId, {
          id: artistId,
          name: item.artist.name,
        })
      }

      if (!uniqueAlbums.has(albumId)) {
        uniqueAlbums.set(albumId, {
          id: item.album.id,
          name: item.album.name,
          artistId: item.album.artistId,
          thumbnailUrl: item.album.thumbnailUrl ?? null,
          year: item.album.year ?? null,
        })
      }
    }
    
    // Insert unique artists only (e.g., 10 ops instead of 500)
    // Note: Using Array.from() for compatibility with current tsconfig target
    Array.from(uniqueArtists.values()).forEach(artist => {
      operations.push(
        tables.artists
          .insert({
            id: artist.id,
            name: artist.name,
            createdAt: now,
            updatedAt: now,
          })
          .onConflict('id', 'ignore')
      )
    })
    
    // Insert unique albums only (e.g., 50 ops instead of 500)
    Array.from(uniqueAlbums.values()).forEach(album => {
      operations.push(
        tables.albums
          .insert({
            id: album.id,
            name: album.name,
            artistId: album.artistId,
            thumbnailUrl: album.thumbnailUrl,
            year: album.year,
            createdAt: now,
            updatedAt: now,
          })
          .onConflict('id', 'ignore')
      )
    })
    
    // Insert all media items (unavoidable - one per item)
    for (const item of event.media) {
      // Compute denormalized fields for fast queries
      const genresFlat = Array.isArray(item.genres) ? item.genres.join(',') : ''
      const providersFlat = item.stream ? Object.keys(item.stream).join(',') : ''
      
      operations.push(
        tables.media
          .insert({
            id: item.id,
            title: item.title,
            artistId: item.artist.id,
            albumId: item.album.id,
            type: item.type,
            duration: item.duration ?? null,
            playCount: 0,
            track: item.track ?? null,
            discNumber: item.discNumber ?? null,
            stream: item.stream,
            cover: item.cover ?? null,
            genres: item.genres,
            externalId: item.externalId ?? null,
            shareUrl: item.shareUrl ?? null,
            filePath: item.filePath ?? null,
            artistName: item.artist.name,
            albumName: item.album.name,
            genresFlat,
            providersFlat,
            createdAt: now,
            updatedAt: now,
          })
          .onConflict('id', 'ignore')
      )
      operations.push(...normalizeGenreRows(item.id, item.genres, now))
    }
    
    return operations
    // Type assertion: LiveStore can't infer the bulk operation's polymorphic return type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,

  'v1.MediaBulkRemoved': (event: { readonly mediaIds: readonly string[] }) => {
    return event.mediaIds.flatMap((id: string) => [
      tables.mediaGenres.delete().where('mediaId', '=', id),
      tables.media.delete().where('id', '=', id),
    ])
  },

  'v1.MediaBulkUpdated': (event: { readonly media: readonly { readonly id: string; readonly title: string; readonly artist: { readonly id: string; readonly name: string }; readonly album: { readonly id: string; readonly name: string; readonly artistId: string }; readonly type: string; readonly duration?: number; readonly track?: number; readonly discNumber?: number; readonly stream: unknown; readonly cover?: unknown; readonly genres: readonly string[]; readonly externalId?: string; readonly shareUrl?: string; readonly filePath?: string }[] }) => {
    const now = Date.now()
    return event.media.flatMap((item: { readonly id: string; readonly title: string; readonly artist: { readonly id: string; readonly name: string }; readonly album: { readonly id: string; readonly name: string; readonly artistId: string }; readonly type: string; readonly duration?: number; readonly track?: number; readonly discNumber?: number; readonly stream: unknown; readonly cover?: unknown; readonly genres: readonly string[]; readonly externalId?: string; readonly shareUrl?: string; readonly filePath?: string }) => {
      // Full-field sync of an existing row. The id is content-derived, so
      // title/artist/album fields are identical to what is stored; the
      // fields that can actually differ are the ones the id does not cover.
      return [
        tables.media
          .update({
            title: item.title,
            artistId: item.artist.id,
            albumId: item.album.id,
            type: item.type,
            duration: item.duration ?? null,
            track: item.track ?? null,
            discNumber: item.discNumber ?? null,
            stream: item.stream,
            cover: item.cover ?? null,
            genres: item.genres,
            externalId: item.externalId ?? null,
            shareUrl: item.shareUrl ?? null,
            filePath: item.filePath ?? null,
            artistName: item.artist.name,
            albumName: item.album.name,
            genresFlat: item.genres.join(','),
            providersFlat: item.stream ? Object.keys(item.stream).join(',') : '',
            updatedAt: now,
          })
          .where('id', '=', item.id),
        // Genre membership is derived state: rebuild it for updated rows.
        tables.mediaGenres.delete().where('mediaId', '=', item.id),
        ...normalizeGenreRows(item.id, item.genres, now),
      ]
    })
  },

  'v1.MediaRemoved': ({ id }: { id: string }) => {
    return [
      tables.mediaGenres.delete().where('mediaId', '=', id),
      tables.media.delete().where('id', '=', id),
    ]
  },

  // Playlist materializers
  'v1.PlaylistCreated': ({ id, name }: { id: string; name: string }) => {
    const now = Date.now()
    return tables.playlists
      .insert({
        id,
        name,
        trackIds: [],
        shuffle: false,
        repeat: false,
        currentPlaying: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflict('id', 'ignore')
  },

  'v1.PlaylistRenamed': ({ playlistId, name }: { playlistId: string; name: string }) => {
    const now = Date.now()
    return tables.playlists
      .update({ name, updatedAt: now })
      .where('id', '=', playlistId)
  },

  'v1.PlaylistReordered': ({ playlistId, trackIds }: { readonly playlistId: string; readonly trackIds: readonly string[] }) => {
    const now = Date.now()
    return tables.playlists
      .update({ trackIds, updatedAt: now })
      .where('id', '=', playlistId)
  },

  'v1.PlaylistDeleted': ({ playlistId }: { playlistId: string }) => {
    return tables.playlists.delete().where('id', '=', playlistId)
  },

  'v1.PlaylistShuffleToggled': ({ playlistId, shuffle }: { playlistId: string; shuffle: boolean }) => {
    const now = Date.now()
    return tables.playlists
      .update({ shuffle, updatedAt: now })
      .where('id', '=', playlistId)
  },

  'v1.PlaylistRepeatToggled': ({ playlistId, repeat }: { playlistId: string; repeat: boolean }) => {
    const now = Date.now()
    return tables.playlists
      .update({ repeat, updatedAt: now })
      .where('id', '=', playlistId)
  },

  // Queue materializers
  'v1.QueueUpdated': ({ id, trackIds, randomTrackIds, currentPlaying, shuffle, repeat }: { readonly id: string; readonly trackIds: readonly string[]; readonly randomTrackIds?: readonly string[]; readonly currentPlaying?: number; readonly shuffle: boolean; readonly repeat: boolean }) => {
    const now = Date.now()
    const currentTrackId = deriveCurrentTrackId(trackIds, randomTrackIds, currentPlaying, shuffle)
    const head = tables.queue
      .insert({
        id,
        currentPlaying: currentPlaying ?? null,
        currentTrackId,
        shuffle,
        repeat,
        updatedAt: now,
      })
      .onConflict('id', 'update', {
        currentPlaying: currentPlaying ?? null,
        currentTrackId,
        shuffle,
        repeat,
        updatedAt: now,
      })
    // Rebuild item rows from the event arrays. Deterministic ids
    // (queueId:list:position) keep eventlog rematerialization idempotent.
    return [
      head,
      tables.queueItems.delete().where('queueId', '=', id),
      ...trackIds.map((trackId: string, position: number) =>
        tables.queueItems.insert({
          id: `${id}:ordered:${position}`,
          queueId: id,
          list: 'ordered',
          position,
          trackId,
        })
      ),
      ...(randomTrackIds ?? []).map((trackId: string, position: number) =>
        tables.queueItems.insert({
          id: `${id}:random:${position}`,
          queueId: id,
          list: 'random',
          position,
          trackId,
        })
      ),
    ]
  },

  'v1.QueueCleared': ({ queueId }: { queueId: string }) => {
    const now = Date.now()
    return [
      tables.queueItems.delete().where('queueId', '=', queueId),
      tables.queue
        .update({
          currentPlaying: null,
          currentTrackId: null,
          updatedAt: now,
        })
        .where('id', '=', queueId),
    ]
  },

  'v1.QueueRepeatToggled': ({ queueId, repeat }: { queueId: string; repeat: boolean }) => {
    const now = Date.now()
    return tables.queue
      .update({ repeat, updatedAt: now })
      .where('id', '=', queueId)
  },

  'v1.QueuePositionChanged': ({ queueId, position, trackId }: { queueId: string; position: number; trackId?: string }) => {
    const now = Date.now()
    const updates: Record<string, unknown> = { currentPlaying: position, updatedAt: now }
    if (trackId !== undefined) updates.currentTrackId = trackId
    return tables.queue
      .update(updates)
      .where('id', '=', queueId)
  },

  // Favorites materializers
  'v1.MediaFavorited': ({ id, mediaId }: { id: string; mediaId: string }) => {
    const now = Date.now()
    return tables.favorites
      .insert({
        id,
        mediaId,
        createdAt: now,
      })
      .onConflict('id', 'ignore')
  },

  'v1.MediaUnfavorited': ({ mediaId }: { mediaId: string }) => {
    return tables.favorites.delete().where('mediaId', '=', mediaId)
  },

  // Lyrics materializers
  'v1.LyricsAdded': ({ id, mediaId, lyricsText, source }: { id: string; mediaId: string; lyricsText: string; source?: string }) => {
    const now = Date.now()
    return tables.lyrics
      .insert({
        id,
        mediaId,
        lyricsText,
        source: source ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflict('id', 'ignore')
  },

  'v1.LyricsUpdated': ({ mediaId, lyricsText }: { mediaId: string; lyricsText: string }) => {
    const now = Date.now()
    return tables.lyrics
      .update({ lyricsText, updatedAt: now })
      .where('mediaId', '=', mediaId)
  },

  'v1.LyricsRemoved': ({ mediaId }: { mediaId: string }) => {
    return tables.lyrics.delete().where('mediaId', '=', mediaId)
  },

  // Smart Playlist materializers
  'v1.SmartPlaylistCreated': ({ id, name, filters }: { readonly id: string; readonly name: string; readonly filters: { readonly genres: readonly string[]; readonly types: readonly string[]; readonly artists: readonly string[]; readonly providers: readonly string[] } }) => {
    const now = Date.now()
    return tables.smartPlaylists
      .insert({
        id,
        name,
        filters,
        createdAt: now,
      })
      .onConflict('id', 'ignore')
  },

  'v1.SmartPlaylistDeleted': ({ smartPlaylistId }: { smartPlaylistId: string }) => {
    return tables.smartPlaylists.delete().where('id', '=', smartPlaylistId)
  },

  // Sync resume state materializers (per-provider rows; see SyncResumeState)
  'v1.SyncStateUpdated': ({ id, lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete }: { id: string; lastSyncTimestamp: string; lastKnownCount: number; initialSyncCursor: number; initialSyncComplete: boolean }) =>
    syncStateUpsert(id, { lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete, cursorPageSize: 0 }),

  'v2.SyncStateUpdated': ({ id, lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete, cursorPageSize }: { id: string; lastSyncTimestamp: string; lastKnownCount: number; initialSyncCursor: number; initialSyncComplete: boolean; cursorPageSize: number }) =>
    syncStateUpsert(id, { lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete, cursorPageSize }),
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
