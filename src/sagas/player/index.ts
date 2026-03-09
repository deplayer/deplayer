import { call, takeLatest, takeEvery, put, select } from 'redux-saga/effects'
import screenfull from 'screenfull'
import { push } from "redux-first-history"
import { queryDb } from '@livestore/livestore'
import Media from '../../entities/Media'

import {
  getPlayer,
  getSongBgFromLiveStore,
  getSongByIdFromLiveStore,
  getState
} from '../selectors'
import { getStreamUri } from '../../services/Song/StreamUriService'
import * as routes from '../../routes'
import * as types from '../../constants/ActionTypes'
import { getLiveStoreInstance } from '../../App'
import { playNextAction, playPreviousAction } from '../../stores/livestore/actions'
import { tables } from '../../stores/livestore/schema'

/**
 * Get current song ID from LiveStore queue
 */
function* getCurrentSongIdFromLiveStore(): any {
  const liveStore = getLiveStoreInstance()
  
  if (!liveStore) {
    console.error('[Player Saga] LiveStore not available')
    return null
  }
  
  try {
    const query = queryDb(
      tables.queue
        .select()
        .where('id', '=', 'default')
        .limit(1)
    )
    
    const result = yield liveStore.query(query)
    
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
    
    if (currentPlaying === null || currentPlaying === undefined) {
      return null
    }
    
    return trackIds[currentPlaying] || null
  } catch (error) {
    console.error('[Player Saga] Error getting current song ID:', error)
    return null
  }
}

/**
 * Stop all currently playing audio/video elements in the DOM.
 * Centralized kill switch that prevents dual-audio bugs.
 * Called before every new track load to ensure only one stream plays.
 */
function stopAllPlayback() {
  if (typeof document === 'undefined') return
  document.querySelectorAll('audio, video').forEach((el) => {
    const mediaEl = el as HTMLMediaElement
    if (!mediaEl.paused) {
      mediaEl.pause()
      mediaEl.currentTime = 0
    }
  })
}

function* setCurrentPlayingStream(songId: string, providerNum: number, media?: Media): any {
  // Kill any playing audio FIRST — prevents dual-stream bug
  yield put({ type: types.STOP_PLAYING })
  stopAllPlayback()

  const currentPlaying = media || (yield call(getSongByIdFromLiveStore, songId))
  const fullUrl = yield call(getSongBgFromLiveStore)

  console.log("Setting current playing stream", currentPlaying, songId);

  // The song can't be found
  if (!currentPlaying) {
    console.warn('[Player Saga] Song not found, playing next')
    return yield put({ type: types.PLAY_NEXT })
  }

  // Getting the first stream URI
  let streamUri = ''
  try {
    streamUri = yield getStreamUri(currentPlaying, providerNum)
  } catch (error) {
    console.error('Error getting stream URI', error)
  }

  if (!streamUri) {
    console.warn('[Player Saga] No stream URI, playing next')
    return yield put({ type: types.PLAY_NEXT })
  }

  yield put({ type: types.SET_CURRENT_PLAYING_URL, url: streamUri })
  yield put({ type: types.SET_CURRENT_PLAYING_STREAMS, streams: currentPlaying.stream })
  yield put({ type: types.SHOW_PLAYER })
  yield put({ type: types.START_PLAYING })

  if (fullUrl) {
    yield put({
      type: types.SET_BACKGROUND_IMAGE,
      backgroundImage: fullUrl
    })
  }
}

export interface SetCurrentPlayingAction {
  type: typeof types.SET_CURRENT_PLAYING
  songId: string
  url: string
  media: Media
}

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: SetCurrentPlayingAction): any {
  const liveStore = getLiveStoreInstance()
  
  // Sync LiveStore queue position if store is available
  if (liveStore && action.songId) {
    try {
      // Import playMediaAction dynamically to avoid circular deps
      const { playMediaAction } = yield import('../../stores/livestore/actions')
      yield call(playMediaAction, liveStore, action.songId)
    } catch (error) {
      // Non-fatal: song might not be in queue yet
      console.debug('[Player Saga] Could not sync LiveStore position:', error)
    }
  }
  
  // Redirect to song view page
  yield put({ type: types.PUSH_TO_VIEW, song: action.songId })

  yield call(setCurrentPlayingStream, action.songId, 0, action.media)
}

function* handleError(): any {
  yield put({ type: types.REGISTER_PLAYER_ERROR })

  const player = yield select(getPlayer)
  
  // Get current song ID from LiveStore
  const currentSongId = yield call(getCurrentSongIdFromLiveStore)
  
  if (currentSongId) {
    yield call(setCurrentPlayingStream, currentSongId, player.errorCount)
  } else {
    console.warn('[Player Saga] No current song to retry')
  }
}

function* handlePlayNext(): any {
  const liveStore = getLiveStoreInstance()
  
  if (!liveStore) {
    console.error('[Player Saga] LiveStore not available')
    return
  }

  // Call LiveStore action to move to next track
  try {
    yield call(playNextAction, liveStore)
    
    // Get the new current song ID
    const currentSongId = yield call(getCurrentSongIdFromLiveStore)
    
    if (currentSongId) {
      yield put({ type: types.SET_CURRENT_PLAYING, songId: currentSongId })
    } else {
      console.log('[Player Saga] End of queue reached')
    }
  } catch (error) {
    console.error('[Player Saga] Error in handlePlayNext:', error)
  }
}

function* handlePlayPrev(): any {
  const liveStore = getLiveStoreInstance()
  
  if (!liveStore) {
    console.error('[Player Saga] LiveStore not available')
    return
  }

  // Call LiveStore action to move to previous track
  try {
    yield call(playPreviousAction, liveStore)
    
    // Get the new current song ID
    const currentSongId = yield call(getCurrentSongIdFromLiveStore)
    
    if (currentSongId) {
      yield put({ type: types.SET_CURRENT_PLAYING, songId: currentSongId })
    }
  } catch (error) {
    console.error('[Player Saga] Error in handlePlayPrev:', error)
  }
}

function* goToViewPage(): any {
  const state = yield select(getState)
  
  if (!state.router.location.pathname.match(/^\/song.*?$/)) {
    return
  }
  
  // Get current song ID from LiveStore
  const currentSongId = yield call(getCurrentSongIdFromLiveStore)
  
  if (currentSongId) {
    yield put(push(routes.songView(currentSongId)))
  }
}

function* handleFullscreen(): any {
  const player = yield select(getPlayer)

  if (!screenfull.isEnabled) {
    return
  }

  if (player.fullscreen) {
    yield put({ type: types.TOGGLE_SIDEBAR, value: false })
    yield screenfull.request()
  } else {
    yield screenfull.exit()
  }
}

/**
 * Handle PLAY_ALL_COMPLETED action
 * Triggered after LiveStore queue is updated by playAllAction
 */
function* handlePlayAllCompleted(action: { type: string; trackId: string }): any {
  if (action.trackId) {
    yield put({ type: types.SET_CURRENT_PLAYING, songId: action.trackId })
  }
}

// Binding actions to sagas
function* playerSaga(): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeEvery(types.PLAY_ERROR, handleError)
  yield takeLatest(types.PLAY_NEXT, handlePlayNext)
  yield takeLatest(types.PLAY_PREV, handlePlayPrev)
  yield takeLatest(types.TOGGLE_FULL_SCREEN, handleFullscreen)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
  yield takeLatest(types.PLAY_ALL_COMPLETED, handlePlayAllCompleted)
}

export default playerSaga
