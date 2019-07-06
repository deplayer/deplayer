import { takeLatest, put, select } from 'redux-saga/effects'
import * as routes from '../routes'
import history from '../store/configureHistory'

import * as types from '../constants/ActionTypes'

const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

const getApp = (state: any): any => {
  return state ? state.app : {}
}

const getSongBg = (state: any): any => {
  const { collection: { rows }, queue: { currentPlaying } } = state
  if (rows[currentPlaying]) {
    const song = rows[currentPlaying]
    const { cover: { fullUrl } } = song
    return fullUrl
  }
  return ''
}

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: any): any {
  // Redirect to song view page
  yield put({type: types.START_PLAYING})
  yield put({type: types.PUSH_TO_VIEW, song: action.songId})
  const fullUrl = yield select(getSongBg)

  yield put({
    type: types.SET_BACKGROUND_IMAGE,
    backgroundImage: fullUrl
  })
}

export function* goToViewPage(action: any): any {
  const app = yield select(getApp)
  const queue = yield select(getQueue)
  if (app.mqlMatch && history.location.pathname.match(/^\/song.*?$/)) {
    yield history.push(routes.songView(queue.currentPlaying))
  }
}

// Binding actions to sagas
function* playerSaga(): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlaying)
  yield takeLatest(types.PLAY_PREV, setCurrentPlaying)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
}

export default playerSaga
