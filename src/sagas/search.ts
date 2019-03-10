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
import IndexService from '../services/Search/IndexService'

type SearchAction = {
  type: string,
  searchTerm: string
}

// Handling search saga
export function* search(action: SearchAction): any {
  try {
    const settings = yield select(getSettings)
    const providersService = new ProvidersService(settings)
    // yield call(goToHomePage)
    const searchPromises = yield call(providersService.search, action.searchTerm)
    const searchResults = yield all(searchPromises)
    for (const result in searchResults) {
      yield put({type: types.SEARCH_FULLFILLED, result: searchResults[result]})
      yield put({type: types.ADD_TO_COLLECTION, data: searchResults[result]})
      yield put({type: types.ADD_SONGS_TO_QUEUE, songs: searchResults[result]})
    }
  } catch (e) {
    yield put({type: types.SEARCH_REJECTED, message: e.message})
  }
  yield put({type: types.SEARCH_FINISHED, searchTerm: action.searchTerm})
}

// generate fulltext index
export function* generateIndex(action): any {
  const service = new IndexService()
  yield service.generateIndexFrom(action.data)
}

// Going to home page
export function* goToHomePage(): any {
  yield history.push('/')
}

// Extract settings from state
export const getSettings = (state: any) => {
  return state ? state.settings.settings : {providers: {}}
}

// Binding actions to sagas
function* searchSaga(): any {
  yield takeLatest(types.START_SEARCH, search)
  yield takeLatest(types.RECEIVE_COLLECTION, generateIndex)
}

export default searchSaga
