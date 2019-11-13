import { takeLatest, put, select } from 'redux-saga/effects'

import { getApp, getQueue, getSongBg } from '../selectors'
import { getCollection } from '../selectors'
import { getSettings } from '../selectors'
import { getStreamUri } from '../../services/Song/StreamUriService'
import history from '../../store/configureHistory'
import * as routes from '../../routes'
import * as types from '../../constants/ActionTypes'

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: any): any {
  // Redirect to song view page
  yield put({type: types.PUSH_TO_VIEW, song: action.songId})
  const fullUrl = yield select(getSongBg)
  const settings = yield select(getSettings)
  const collection = yield select(getCollection)
  console.log('songId', action)
  const currentPlaying = collection.rows[action.songId]

  // Getting the first stream URI, in the future will be choosen based on
  // priorities
  const streamUri = getStreamUri(currentPlaying, settings)
  yield put({type: types.SET_CURRENT_PLAYING_URL, url: streamUri})
  yield put({type: types.SET_CURRENT_PLAYING_STREAMS, streams: currentPlaying.stream})
  yield put({type: types.START_PLAYING})

  yield put({
    type: types.SET_BACKGROUND_IMAGE,
    backgroundImage: fullUrl
  })
}

export function* handlePlayNext(): any {
  const queue = yield select(getQueue)
  const songId = queue.nextSongId
  yield put({type: types.SET_CURRENT_PLAYING, songId})
}

export function* handlePlayPrev(): any {
  const queue = yield select(getQueue)
  const songId = queue.prevSongId
  yield put({type: types.SET_CURRENT_PLAYING, songId})
}

export function* goToViewPage(): any {
  const app = yield select(getApp)
  const queue = yield select(getQueue)
  if (app.mqlMatch && history.location.pathname.match(/^\/song.*?$/)) {
    yield history.push(routes.songView(queue.currentPlaying))
  }
}

// Binding actions to sagas
function* playerSaga(): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeLatest(types.PLAY_NEXT, handlePlayNext)
  yield takeLatest(types.PLAY_PREV, handlePlayPrev)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
}

export default playerSaga