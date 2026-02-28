import { call } from 'redux-saga/effects'
import { queryDb } from '@livestore/livestore'
import { getLiveStoreInstance } from '../App'
import { tables } from '../stores/livestore/schema'

/**
 * Get settings from LiveStore
 * Use this in sagas instead of select(getSettings)
 */
export function* getSettingsFromLiveStore(): Generator<any, any, any> {
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
function transformMediaFromLiveStore(rawMedia: any): any {
  if (!rawMedia) return null
  
  // Parse JSON fields if they're strings
  const parseJson = (val: any, defaultVal: any = {}) => {
    if (!val) return defaultVal
    if (typeof val === 'object') return val
    try {
      return JSON.parse(val)
    } catch {
      return defaultVal
    }
  }
  
  // Reconstruct nested artist object from flat fields
  const artist = {
    id: rawMedia.artistId || '',
    name: rawMedia.artistName || 'Unknown Artist',
  }
  
  // Reconstruct nested album object from flat fields
  const album = {
    id: rawMedia.albumId || '',
    name: rawMedia.albumName || 'Unknown Album',
    artistId: rawMedia.artistId || '',
    artist: artist,
    thumbnailUrl: rawMedia.cover?.thumbnailUrl || null,
    year: rawMedia.year || null,
  }
  
  return {
    ...rawMedia,
    stream: parseJson(rawMedia.stream, {}),
    cover: parseJson(rawMedia.cover, null),
    genres: parseJson(rawMedia.genres, []),
    artist,
    album,
  }
}

/**
 * Get media by ID from LiveStore
 * Use this in sagas instead of select(getSongById, id)
 */
export function* getSongByIdFromLiveStore(songId: string): Generator<any, any, any> {
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
export function* getCurrentSongFromLiveStore(): Generator<any, any, any> {
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
export function* getSongBgFromLiveStore(): Generator<any, any, any> {
  const song = yield call(getCurrentSongFromLiveStore)
  return song?.cover?.fullUrl || ''
}

// Legacy Redux selector (deprecated - use getSettingsFromLiveStore instead)
// Extract settings from state
export const getSettings = (state: any) => {
  return state ? state.settings.settings : { providers: {} }
}

export const getState = (state: any) => {
  return state
}

export const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

export const getCollection = (state: any): any => {
  return state ? state.collection : {}
}

export const getPlayer = (state: any): any => {
  return state ? state.player : {}
}

export const getSongBg = (state: any): any => {
  const { collection: { rows }, queue: { currentPlaying } } = state
  if (rows[currentPlaying]) {
    const song = rows[currentPlaying]
    return song.cover?.fullUrl
  }
  return ''
}

export const getCurrentSong = (state: any) => {
  if (!state) {
    return
  }

  const rows = state.collection.rows
  const currentId = state.queue.currentPlaying
  return rows[currentId]
}

export const getSongById = (state: any, id: string) => {
  return state.collection.rows[id]
}
