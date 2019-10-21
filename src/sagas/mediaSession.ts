import { takeLatest, call, select } from 'redux-saga/effects'

import { getCurrentSong } from './selectors'
import MediaSessionService from '../services/MediaSessionService'
import * as types from '../constants/ActionTypes'

// Handling START_PLAYING saga
export function* setCurrentPlayingMeta (dispatch: any): any {
  const mediaSessionService = new MediaSessionService()
  const currentSong = yield select(getCurrentSong)
  yield call(mediaSessionService.updateMetadata, currentSong, dispatch)
}

// Binding actions to sagas
function* mediaSessionSaga(store: any): any {
  yield takeLatest(types.SET_CURRENT_PLAYING, setCurrentPlayingMeta, store.dispatch)
  yield takeLatest(types.PLAY_NEXT, setCurrentPlayingMeta, store.dispatch)
  yield takeLatest(types.PLAY_PREV, setCurrentPlayingMeta, store.dispatch)
}

export default mediaSessionSaga
