import { call, takeLatest, takeEvery, put, select } from 'redux-saga/effects'
import screenfull from 'screenfull'
import { push } from "redux-first-history"

import {
  getCollection,
  getPlayer,
  getQueue,
  getSettings,
  getSongBg,
  getState
} from '../selectors'
import { getStreamUri } from '../../services/Song/StreamUriService'
import * as routes from '../../routes'
import * as types from '../../constants/ActionTypes'

export function* setCurrentPlayingStream(songId: string, providerNum: number): any {
  const settings = yield select(getSettings)
  const collection = yield select(getCollection)
  const fullUrl = yield select(getSongBg)
  const currentPlaying = collection.rows[songId]

  // The song can't be found
  if (!currentPlaying) {
    return yield put({ type: types.PLAY_NEXT })
  }

  // Getting the first stream URI, in the future will be choosen based on
  // priorities
  const streamUri = yield getStreamUri(currentPlaying, settings, providerNum)

  if (!streamUri) {
    return yield put({ type: types.PLAY_NEXT })
  }

  yield put({ type: types.SET_CURRENT_PLAYING_URL, url: streamUri })
  yield put({ type: types.SET_CURRENT_PLAYING_STREAMS, streams: currentPlaying.stream })
  yield put({ type: types.START_PLAYING })

  if (fullUrl) {
    yield put({
      type: types.SET_BACKGROUND_IMAGE,
      backgroundImage: fullUrl
    })
  }
}

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: any): any {
  // Redirect to song view page
  yield put({ type: types.PUSH_TO_VIEW, song: action.songId })

  yield call(setCurrentPlayingStream, action.songId, 0)
}

export function* handleError(): any {
  yield put({ type: types.REGISTER_PLAYER_ERROR })

  const queue = yield select(getQueue)
  const player = yield select(getPlayer)

  yield call(setCurrentPlayingStream, queue.currentPlaying, player.errorCount)
}

export function* handlePlayNext(): any {
  const queue = yield select(getQueue)
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
  const songId = queue.nextSongId

  if (queue.repeat && !songId && trackIds[0]) {
    yield put({ type: types.SET_CURRENT_PLAYING, songId: trackIds[0] })
  } else if (songId) {
    yield put({ type: types.SET_CURRENT_PLAYING, songId })
  }
}

export function* handlePlayPrev(): any {
  const queue = yield select(getQueue)
  const trackIds = queue.shuffle ? queue.randomTrackIds : queue.trackIds
  const songId = queue.prevSongId

  console.log('last item: ', trackIds[trackIds.length - 1])

  if (queue.repeat && !songId && trackIds[trackIds.length - 1]) {
    yield put({ type: types.SET_CURRENT_PLAYING, songId: trackIds[trackIds.length - 1] })
  } else if (songId) {
    yield put({ type: types.SET_CURRENT_PLAYING, songId })
  }
}
export function* goToViewPage(): any {
  const queue = yield select(getQueue)
  const state = yield select(getState)
  if (state.router.location.pathname.match(/^\/song.*?$/)) {
    yield put(push(routes.songView(queue.currentPlaying)))
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
  yield takeLatest(types.SET_FULL_SCREEN, handleFullscreen)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
}

export default playerSaga
