import { call, takeLatest, takeEvery, put, select } from 'redux-saga/effects'
import screenfull from 'screenfull'
import { push } from "redux-first-history"
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
    const result = yield liveStore.query({
      query: `SELECT * FROM queue WHERE id = ?`,
      bindValues: { 1: 'default' }
    })
    
    const rows = (result as any)?.[0]?.values || []
    
    if (rows.length === 0) {
      return null
    }
    
    const trackIds = JSON.parse(rows[0][1] || '[]')
    const currentPlaying = rows[0][3]
    
    if (currentPlaying === null || currentPlaying === undefined) {
      return null
    }
    
    return trackIds[currentPlaying] || null
  } catch (error) {
    console.error('[Player Saga] Error getting current song ID:', error)
    return null
  }
}

function* setCurrentPlayingStream(songId: string, providerNum: number, media?: Media): any {
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

// Binding actions to sagas
function* playerSaga(): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeEvery(types.PLAY_ERROR, handleError)
  yield takeLatest(types.PLAY_NEXT, handlePlayNext)
  yield takeLatest(types.PLAY_PREV, handlePlayPrev)
  yield takeLatest(types.TOGGLE_FULL_SCREEN, handleFullscreen)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
}

export default playerSaga
