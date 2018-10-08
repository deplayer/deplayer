// @flow

import { call, put, takeLatest } from 'redux-saga/effects'
import history from '../store/configureHistory'

import { IRepository } from '../repositories/IRepository'
import ItunesApiRepository from '../repositories/ItunesApiRepository'
import {
  START_SEARCH,
  SEARCH_FULLFILLED,
  SEARCH_REJECTED,
  FILL_VISIBLE_SONGS_FULLFILLED
} from '../constants/ActionTypes'
import SongService from '../services/SongService'

type SearchAction = {
  type: string,
  searchTerm: string
}

// Handling search saga
export function* search(repository: IRepository, action: SearchAction): Generator<void, void, void> {
  const songService = new SongService(repository)
  yield call(goToHomePage)
  try {
    const searchResults = yield call(songService.search, action.searchTerm)
    yield put({type: SEARCH_FULLFILLED, searchResults})
    yield put({type: FILL_VISIBLE_SONGS_FULLFILLED, data: searchResults})
  } catch (e) {
    yield put({type: SEARCH_REJECTED, message: e.message})
  }
}

export function* goToHomePage(): Generator<void, void, void> {
  yield history.push('/')
}

// Binding actions to sagas
function* searchSaga(): Generator<void, void, void> {
  const repository = new ItunesApiRepository()
  yield takeLatest(START_SEARCH, search, repository)
}

export default searchSaga
