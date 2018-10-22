// @flow

import { call, put, takeLatest, select } from 'redux-saga/effects'
import history from '../store/configureHistory'

import { IConfig } from '../interfaces/IConfig'
import  * as types from '../constants/ActionTypes'
import ProvidersService from '../services/ProvidersService'

type SearchAction = {
  type: string,
  searchTerm: string
}

// Handling search saga
export function* search(config: IConfig, action: SearchAction): Generator<void, void, void> {
  console.log(config)
  const songService = new ProvidersService(config)
  yield call(goToHomePage)
  try {
    const searchResults = yield call(songService.search, action.searchTerm)
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

const getConfig = state => state.config

// Binding actions to sagas
function* searchSaga(): Generator<void, void, void> {
  const config = yield select(getConfig)
  yield takeLatest(types.START_SEARCH, search, config)
}

export default searchSaga
