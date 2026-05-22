import { call } from 'redux-saga/effects'
import { queryDb } from '@livestore/livestore'
import { getLiveStoreInstance } from '../App'
import { tables } from '../stores/livestore/schema'
import type { State } from '../reducers'
import type { MediaRow } from '../types/media'

/**
 * Get settings from LiveStore
 * Use this in sagas instead of select(getSettings)
 */
export function* getSettingsFromLiveStore(): Generator<any, Record<string, unknown>, any> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available, returning default settings')
    return { providers: {}, app: {} }
  }
  
  const query = queryDb(
    tables.settings.select().where('id', '=', 'default').limit(1)
  )
  
  const result = yield call(() => liveStore.query(query))
  return result[0]?.settings || { providers: {}, app: {} }
}

/**
 * Transform raw LiveStore media data to include nested artist/album objects
 * and parse JSON fields. Mirrors the transformation in hooks/useMedia.ts
 */
export type TransformedMedia = MediaRow & {
  artist: { id: string; name: string }
  album: { id: string; name: string; artistId: string; artist: { id: string; name: string }; thumbnailUrl: unknown; year: unknown }
}

function transformMediaFromLiveStore(rawMedia: Record<string, unknown>): TransformedMedia | null {
  if (!rawMedia) return null

  // Parse JSON fields if they're strings
  const parseJson = (val: unknown, defaultVal: unknown = {}) => {
    if (!val) return defaultVal
    if (typeof val === 'object') return val
    if (typeof val === 'string') {
      try {
        return JSON.parse(val)
      } catch {
        return defaultVal
      }
    }
    return defaultVal
  }
  
  // Reconstruct nested artist object from flat fields
  const artist = {
    id: (rawMedia.artistId as string) || '',
    name: (rawMedia.artistName as string) || 'Unknown Artist',
  }

  const cover = parseJson(rawMedia.cover, null) as { thumbnailUrl?: string } | null

  // Reconstruct nested album object from flat fields
  const album = {
    id: (rawMedia.albumId as string) || '',
    name: (rawMedia.albumName as string) || 'Unknown Album',
    artistId: (rawMedia.artistId as string) || '',
    artist: artist,
    thumbnailUrl: cover?.thumbnailUrl || null,
    year: rawMedia.year || null,
  }

  return {
    ...rawMedia,
    stream: parseJson(rawMedia.stream, {}),
    cover,
    genres: parseJson(rawMedia.genres, []),
    artist,
    album,
  } as TransformedMedia
}

/**
 * Get media by ID from LiveStore
 * Use this in sagas instead of select(getSongById, id)
 */
export function* getSongByIdFromLiveStore(songId: string): Generator<any, TransformedMedia | null, any> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available')
    return null
  }
  
  const query = queryDb(
    tables.media.select().where('id', '=', songId).limit(1)
  )
  
  const result = yield call(() => liveStore.query(query))
  return transformMediaFromLiveStore(result[0])
}

/**
 * Get current playing song from LiveStore
 * Use this in sagas instead of select(getCurrentSong)
 */
export function* getCurrentSongFromLiveStore(): Generator<any, TransformedMedia | null, any> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available')
    return null
  }
  
  // Get currentPlaying ID from LiveStore queue using queryDb for consistency
  try {
    const query = queryDb(
      tables.queue
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )
    
    const result = yield call(() => liveStore.query(query))
    
    // queryDb returns array of objects directly
    const row = Array.isArray(result) ? result[0] : null
    
    if (!row) {
      return null
    }
    
    // Parse trackIds if it's a string
    let trackIds = row.trackIds
    if (typeof trackIds === 'string') {
      try {
        trackIds = JSON.parse(trackIds)
      } catch {
        trackIds = []
      }
    }
    
    const currentPlaying = row.currentPlaying
    const shuffle = Boolean(row.shuffle)
    
    // Use randomTrackIds if shuffle is enabled
    if (shuffle && row.randomTrackIds) {
      let randomTrackIds = row.randomTrackIds
      if (typeof randomTrackIds === 'string') {
        try {
          randomTrackIds = JSON.parse(randomTrackIds)
        } catch {
          randomTrackIds = []
        }
      }
      trackIds = randomTrackIds
    }
    
    if (currentPlaying === null || currentPlaying === undefined || currentPlaying < 0) {
      return null
    }
    
    const currentId = trackIds[currentPlaying]
    if (!currentId) {
      return null
    }
    
    // Get the song from LiveStore
    return yield call(getSongByIdFromLiveStore, currentId)
  } catch (error) {
    console.error('[Selectors] Error getting current song:', error)
    return null
  }
}

/**
 * Get song background image URL from LiveStore
 * Use this in sagas instead of select(getSongBg)
 */
export function* getSongBgFromLiveStore(): Generator<any, string, any> {
  const song = yield call(getCurrentSongFromLiveStore)
  return song?.cover?.fullUrl || ''
}

// Legacy Redux selector (deprecated - use getSettingsFromLiveStore instead)
// Extract settings from state
export const getSettings = (state: State & { settings?: { settings: Record<string, unknown> } }) => {
  return state ? state.settings?.settings : { providers: {} }
}

export const getState = (state: State) => {
  return state
}

export const getQueue = (state: State & { queue?: Record<string, unknown> }) => {
  return state ? state.queue : {}
}

export const getCollection = (state: State) => {
  return state ? state.collection : {}
}

export const getPlayer = (state: State) => {
  return state ? state.player : {}
}

export const getSongBg = (state: State & { queue: { currentPlaying: string } }) => {
  const { collection: { rows }, queue: { currentPlaying } } = state
  if (rows[currentPlaying]) {
    const song = rows[currentPlaying]
    return song.cover?.fullUrl
  }
  return ''
}

export const getCurrentSong = (state: State & { queue: { currentPlaying: string } } | null) => {
  if (!state) {
    return
  }

  const rows = state.collection.rows
  const currentId = state.queue.currentPlaying
  return rows[currentId]
}

export const getSongById = (state: State, id: string) => {
  return state.collection.rows[id]
}
