// @flow

import { call, put, takeLatest, select } from 'redux-saga/effects'
import history from '../store/configureHistory'

import  * as types from '../constants/ActionTypes'
import ProvidersService from '../services/ProvidersService'

type SearchAction = {
  type: string,
  searchTerm: string
}

// Handling search saga
export function* search(action: SearchAction): Generator<void, void, void> {
  const settings = yield select(getSettings)
  console.log('saga received settings', settings)
  const providersService = new ProvidersService(settings)
  yield call(goToHomePage)
  try {
    const searchResults = yield call(providersService.search, action.searchTerm)
    yield put({type: types.SEARCH_FULLFILLED, searchResults})
    yield put({type: types.ADD_TO_COLLECTION, data: searchResults})
    yield put({type: types.ADD_SONGS_TO_PLAYLIST, songs: searchResults})
  } catch (e) {
    yield put({type: types.SEARCH_REJECTED, message: e.message})
  }
}

// Going to home page
export function* goToHomePage(): Generator<void, void, void> {
  yield history.push('/')
}

// Extract settings from state
export const getSettings = (state: any) => {
  return state ? state.settings.settings : {providers: {}}
}

// Binding actions to sagas
function* searchSaga(): Generator<void, void, void> {
  yield takeLatest(types.START_SEARCH, search)
}

export default searchSaga
