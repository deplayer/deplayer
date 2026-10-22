import { type Effect, call } from 'redux-saga/effects'
import { queryDb } from '@livestore/livestore'
import { rawToMediaRow } from '../stores/livestore/transformMedia'
import { getLiveStoreInstance } from '../stores/livestore/accessor'
import { tables } from '../stores/livestore/schema'
import type { State } from '../reducers'
import type { MediaRow } from '../types/media'
import { EMPTY_SETTINGS, parseSettingsRow } from '../services/settings/shape'
import type { SettingsShape } from '../services/settings/shape'
import type * as QueueModule from '../stores/livestore/queue'
import type { QueueState } from '../stores/livestore/queue'

/**
 * Get settings from LiveStore
 * Use this in sagas instead of select(getSettings)
 */
export function* getSettingsFromLiveStore(): Generator<Effect, SettingsShape, unknown> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available, returning default settings')
    return EMPTY_SETTINGS
  }
  
  const query = queryDb(
    tables.settings.select().where('id', '=', 'default').limit(1)
  )
  
  const result = (yield call(() => liveStore.query(query))) as unknown
  return parseSettingsRow((result as Array<{ settings: unknown }>)[0]?.settings)
}

/**
 * Get media by ID from LiveStore
 * Use this in sagas instead of select(getSongById, id)
 */
export function* getSongByIdFromLiveStore(songId: string): Generator<Effect, MediaRow | null, unknown> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available')
    return null
  }
  
  const query = queryDb(
    tables.media.select().where('id', '=', songId).limit(1)
  )
  
  const result = (yield call(() => liveStore.query(query))) as unknown[]
  return rawToMediaRow(result[0])
}

/**
 * Get current playing song from LiveStore.
 * Uses the shared readQueue + resolveCurrentSongId so the saga and the
 * PlaybackController resolve the same track.
 */
export function* getCurrentSongFromLiveStore(): Generator<Effect, MediaRow | null, unknown> {
  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    console.warn('LiveStore not available')
    return null
  }

  const { readQueue, resolveCurrentSongId } = (yield call(
    () => import('../stores/livestore/queue')
  )) as typeof QueueModule

  const queue = (yield call(() => readQueue(liveStore))) as QueueState | null
  if (!queue) return null

  const currentId = resolveCurrentSongId(queue)
  if (!currentId) return null

  return (yield call(getSongByIdFromLiveStore, currentId)) as MediaRow | null
}

/**
 * Get song background image URL from LiveStore
 * Use this in sagas instead of select(getSongBg)
 */
export function* getSongBgFromLiveStore(): Generator<Effect, string, unknown> {
  const song = (yield call(getCurrentSongFromLiveStore)) as MediaRow | null
  return song?.cover?.fullUrl || ''
}

// Legacy Redux selectors were deleted during the LiveStore migration;
// the *FromLiveStore generators above are the only LiveStore read path.

export const getPlayer = (state: State) => {
  return state ? state.player : {}
}
