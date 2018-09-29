// @flow

import { call, put, takeLatest } from 'redux-saga/effects'

import { IRepository } from '../repositories/IRepository'
import ItunesApiRepository from '../repositories/ItunesApiRepository'
import {
  START_SEARCH,
  SEARCH_FULLFILLED,
  SEARCH_REJECTED
} from '../constants/ActionTypes'
import SongService from '../services/SongService'

type SearchAction = {
  type: string,
  searchTerm: string
}

// Handling search saga
export function* search(repository: IRepository, action: SearchAction): Generator<void, void, void> {
  const songService = new SongService(repository)

  try {
    const searchResults = yield call(songService.search, action.searchTerm)
    yield put({type: SEARCH_FULLFILLED, searchResults})
  } catch (e) {
    yield put({type: SEARCH_REJECTED, message: e.message})
  }
}

// Binding actions to sagas
function* searchSaga(): Generator<void, void, void> {
  const repository = new ItunesApiRepository()
  yield takeLatest(START_SEARCH, search, repository)
}

export default searchSaga