// @flow

import {
  call,
  put,
  takeLatest,
  select,
  all
} from 'redux-saga/effects'
import history from '../store/configureHistory'

import  * as types from '../constants/ActionTypes'
import ProvidersService from '../services/ProvidersService'

type SearchAction = {
  type: string,
  searchTerm: string
}

// Handling search saga
export function* search(action: SearchAction): Generator<void, void, void> {
  try {
    const settings = yield select(getSettings)
    const providersService = new ProvidersService(settings)
    yield call(goToHomePage)
    const searchPromises = yield call(providersService.search, action.searchTerm)
    const searchResults = yield all(searchPromises)
    for (const result in searchResults) {
      yield put({type: types.SEARCH_FULLFILLED, result: searchResults[result]})
      yield put({type: types.ADD_TO_COLLECTION, data: searchResults[result]})
      yield put({type: types.ADD_SONGS_TO_PLAYLIST, songs: searchResults[result]})
    }
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
