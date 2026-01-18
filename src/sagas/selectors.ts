import { call } from 'redux-saga/effects'
import { getLiveStoreInstance } from '../App'
import { queryDb } from '@livestore/livestore'
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
  return result[0] || null
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
  
  // Get currentPlaying ID from LiveStore queue
  try {
    const result = yield call(() => liveStore.query({
      query: `SELECT * FROM queue WHERE id = ?`,
      bindValues: { 1: 'default' }
    }))
    
    const rows = (result as any)?.[0]?.values || []
    
    if (rows.length === 0) {
      return null
    }
    
    const trackIds = JSON.parse(rows[0][1] || '[]')
    const currentPlaying = rows[0][3]
    
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
