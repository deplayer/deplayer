import { takeLatest, put, select } from 'redux-saga/effects'
import history from '../store/configureHistory'

import * as types from '../constants/ActionTypes'

export const getQueue = (state: any): any => {
  return state ? state.queue : {}
}

// Handling setCurrentPlaying saga
export function* setCurrentPlaying(action: any): any {
  // Redirect to song view page
  yield put({type: types.START_PLAYING})
  yield put({type: types.PUSH_TO_VIEW, song: action.songId})
}

export function* goToViewPage(action: any): any {
  const queue = yield select(getQueue)
  yield history.push(`/song/${ queue.currentPlaying }`)
}

// Binding actions to sagas
function* playerSaga(): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlaying)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlaying)
  yield takeLatest(types.PUSH_TO_VIEW, goToViewPage)
}

export default playerSaga
