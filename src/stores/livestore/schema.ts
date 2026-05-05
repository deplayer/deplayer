import { makeSchema, State } from '@livestore/livestore'
// Import event definitions
import { mediaEvents } from './events/media'
import { playlistEvents } from './events/playlist'
import { smartPlaylistEvents } from './events/smartPlaylist'
import { queueEvents } from './events/queue'
import { favoriteEvents } from './events/favorites'
import { lyricsEvents } from './events/lyrics'
import { settingsEvents } from './events/settings'
import { playbackEvents } from './events/playback'
import { syncEvents } from './events/sync'

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

  // Queue table
  queue: State.SQLite.table({
    name: 'queue',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      trackIds: State.SQLite.json({ default: [] }),
      randomTrackIds: State.SQLite.json({ default: [] }),
      currentPlaying: State.SQLite.integer({ nullable: true }),
      shuffle: State.SQLite.boolean({ default: false }),
      repeat: State.SQLite.boolean({ default: false }),
      updatedAt: State.SQLite.integer({}),
    },
  }),

  // Playback state table (LOCAL - not synced across devices)
  playback: State.SQLite.table({
    name: 'playback',
    columns: {
      id: State.SQLite.text({ primaryKey: true }), // 'default'
      currentTrackId: State.SQLite.text({ nullable: true }),
      streamUri: State.SQLite.text({ nullable: true }),
      playing: State.SQLite.boolean({ default: false }),
      volume: State.SQLite.integer({ default: 80 }),
      duration: State.SQLite.real({ default: 0 }),
      position: State.SQLite.real({ default: 0 }),
      updatedAt: State.SQLite.integer({}),
    },
  }),

  // Favorites table
  favorites: State.SQLite.table({
    name: 'favorites',
    columns: {
      id: State.SQLite.text({ primaryKey: true }),
      mediaId: State.SQLite.text({}),
      createdAt: State.SQLite.integer({}),
    },
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
  ...playbackEvents,
  ...syncEvents,
}

// ============================================================================
// MATERIALIZERS - Map events to SQLite operations
// ============================================================================

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

    return tables.media.update(updates).where('id', '=', id)
  },

  'v1.MediaPlayed': ({ id }: { id: string }) => {
    // Note: PlayCount is tracked in the application layer, and when significant,
    // a MediaUpdated event with the new playCount value should be dispatched.
    // This event only updates the timestamp to track when the media was played.
    // Alternative approach: Dispatch MediaUpdated({ id, playCount: currentPlayCount + 1 })
    // from the application layer after reading current value.
    return tables.media
      .update({ updatedAt: Date.now() })
      .where('id', '=', id)
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      if (!uniqueArtists.has(item.artist.id)) {
        uniqueArtists.set(item.artist.id, {
          id: item.artist.id,
          name: item.artist.name,
        })
      }
      
      if (!uniqueAlbums.has(item.album.id)) {
        uniqueAlbums.set(item.album.id, {
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
    }
    
    return operations
    // Type assertion: LiveStore can't infer the bulk operation's polymorphic return type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any,

  'v1.MediaBulkRemoved': (event: { readonly mediaIds: readonly string[] }) => {
    return event.mediaIds.map((id: string) =>
      tables.media.delete().where('id', '=', id)
    )
  },

  'v1.MediaRemoved': ({ id }: { id: string }) => {
    return tables.media.delete().where('id', '=', id)
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

  'v1.PlaylistTrackAdded': ({ playlistId, trackId: _trackId, position: _position }: { playlistId: string; trackId: string; position?: number }) => {
    const now = Date.now()
    // Note: Since LiveStore's QueryBuilder doesn't support raw SQL expressions for JSON manipulation,
    // we rely on the application layer to:
    // 1. Read current trackIds
    // 2. Append/insert trackId at position
    // 3. Dispatch PlaylistReordered event with the new trackIds array
    // This materializer only updates the timestamp to track when the change occurred
    return tables.playlists
      .update({ updatedAt: now })
      .where('id', '=', playlistId)
  },

  'v1.PlaylistTrackRemoved': ({ playlistId, trackId: _trackId }: { playlistId: string; trackId: string }) => {
    const now = Date.now()
    // Note: Same as PlaylistTrackAdded - application layer should:
    // 1. Read current trackIds
    // 2. Remove trackId
    // 3. Dispatch PlaylistReordered event with the new trackIds array
    return tables.playlists
      .update({ updatedAt: now })
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
    return tables.queue
      .insert({
        id,
        trackIds,
        randomTrackIds: randomTrackIds ?? [],
        currentPlaying: currentPlaying ?? null,
        shuffle,
        repeat,
        updatedAt: now,
      })
      .onConflict('id', 'update', {
        trackIds,
        randomTrackIds: randomTrackIds ?? [],
        currentPlaying: currentPlaying ?? null,
        shuffle,
        repeat,
        updatedAt: now,
      })
  },

  'v1.QueueTrackAdded': ({ queueId, trackId: _trackId, position: _position }: { queueId: string; trackId: string; position?: number }) => {
    const now = Date.now()
    // Note: Same as playlists - application layer should:
    // 1. Read current trackIds
    // 2. Append/insert trackId at position
    // 3. Dispatch QueueUpdated event with the new trackIds array
    return tables.queue
      .update({ updatedAt: now })
      .where('id', '=', queueId)
  },

  'v1.QueueTrackRemoved': ({ queueId, trackId: _trackId }: { queueId: string; trackId: string }) => {
    const now = Date.now()
    // Note: Application layer should:
    // 1. Read current trackIds
    // 2. Remove trackId
    // 3. Dispatch QueueUpdated event with the new trackIds array
    return tables.queue
      .update({ updatedAt: now })
      .where('id', '=', queueId)
  },

  'v1.QueueCleared': ({ queueId }: { queueId: string }) => {
    const now = Date.now()
    return tables.queue
      .update({
        trackIds: [],
        randomTrackIds: [],
        currentPlaying: null,
        updatedAt: now,
      })
      .where('id', '=', queueId)
  },

  'v1.QueueShuffleToggled': ({ queueId, shuffle }: { queueId: string; shuffle: boolean }) => {
    const now = Date.now()
    return tables.queue
      .update({ shuffle, updatedAt: now })
      .where('id', '=', queueId)
  },

  'v1.QueueRepeatToggled': ({ queueId, repeat }: { queueId: string; repeat: boolean }) => {
    const now = Date.now()
    return tables.queue
      .update({ repeat, updatedAt: now })
      .where('id', '=', queueId)
  },

  'v1.QueuePositionChanged': ({ queueId, position }: { queueId: string; position: number }) => {
    const now = Date.now()
    return tables.queue
      .update({ currentPlaying: position, updatedAt: now })
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

  // Playback materializers (LOCAL - not synced)
  'v1.PlaybackUpdated': ({ id, currentTrackId, streamUri, playing, volume, duration, position }: { id: string; currentTrackId?: string | null; streamUri?: string | null; playing: boolean; volume: number; duration?: number; position?: number }) => {
    const now = Date.now()
    return tables.playback
      .insert({
        id,
        currentTrackId: currentTrackId ?? null,
        streamUri: streamUri ?? null,
        playing,
        volume,
        duration: duration ?? 0,
        position: position ?? 0,
        updatedAt: now,
      })
      .onConflict('id', 'update', {
        currentTrackId: currentTrackId ?? null,
        streamUri: streamUri ?? null,
        playing,
        volume,
        duration: duration ?? 0,
        position: position ?? 0,
        updatedAt: now,
      })
  },

  'v1.PlaybackPlayingChanged': ({ id, playing }: { id: string; playing: boolean }) => {
    const now = Date.now()
    return tables.playback
      .update({ playing, updatedAt: now })
      .where('id', '=', id)
  },

  'v1.PlaybackVolumeChanged': ({ id, volume }: { id: string; volume: number }) => {
    const now = Date.now()
    return tables.playback
      .update({ volume, updatedAt: now })
      .where('id', '=', id)
  },

  'v1.PlaybackPositionChanged': ({ id, position }: { id: string; position: number }) => {
    const now = Date.now()
    return tables.playback
      .update({ position, updatedAt: now })
      .where('id', '=', id)
  },

  'v1.PlaybackTrackChanged': ({ id, currentTrackId, streamUri, duration }: { id: string; currentTrackId: string; streamUri: string; duration?: number }) => {
    const now = Date.now()
    return tables.playback
      .update({
        currentTrackId,
        streamUri,
        duration: duration ?? 0,
        position: 0,
        playing: true,
        updatedAt: now,
      })
      .where('id', '=', id)
  },

  // Sync State materializer
  'v1.SyncStateUpdated': ({ id, lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete }: { id: string; lastSyncTimestamp: string; lastKnownCount: number; initialSyncCursor: number; initialSyncComplete: boolean }) => {
    const now = Date.now()
    return tables.syncState
      .insert({
        id,
        lastSyncTimestamp,
        lastKnownCount,
        initialSyncCursor,
        initialSyncComplete,
        updatedAt: now,
      })
      .onConflict('id', 'update', {
        lastSyncTimestamp,
        lastKnownCount,
        initialSyncCursor,
        initialSyncComplete,
        updatedAt: now,
      })
  },

  'v1.PlaybackCleared': ({ id }: { id: string }) => {
    const now = Date.now()
    return tables.playback
      .update({
        currentTrackId: null,
        streamUri: null,
        playing: false,
        position: 0,
        duration: 0,
        updatedAt: now,
      })
      .where('id', '=', id)
  },
})

const state = State.SQLite.makeState({ tables, materializers })

export const schema = makeSchema({ events, state })
