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
