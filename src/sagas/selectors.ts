import { call } from 'redux-saga/effects'
import { queryDb } from '@livestore/livestore'
import { rawToMediaRow } from '../stores/livestore/transformMedia'
import { getLiveStoreInstance } from '../stores/livestore/accessor'
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
 * Get media by ID from LiveStore
 * Use this in sagas instead of select(getSongById, id)
 */
export function* getSongByIdFromLiveStore(songId: string): Generator<any, MediaRow | null, any> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available')
    return null
  }
  
  const query = queryDb(
    tables.media.select().where('id', '=', songId).limit(1)
  )
  
  const result = yield call(() => liveStore.query(query))
  return rawToMediaRow(result[0])
}

/**
 * Get current playing song from LiveStore.
 * Uses the shared readQueue + resolveCurrentSongId so the saga and the
 * PlaybackController resolve the same track.
 */
export function* getCurrentSongFromLiveStore(): Generator<any, MediaRow | null, any> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available')
    return null
  }

  const { readQueue } = yield import('../stores/livestore/actions/queue')
  const { resolveCurrentSongId } = yield import('../stores/livestore/hooks/queueUtils')

  const queue = yield call(() => readQueue(liveStore as any))
  if (!queue) return null

  const currentId = resolveCurrentSongId(queue)
  if (!currentId) return null

  return yield call(getSongByIdFromLiveStore, currentId)
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
