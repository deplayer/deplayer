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
export function* search(action: SearchAction): any {
  try {
    const settings = yield select(getSettings)
    const providersService = new ProvidersService(settings)
    yield call(goToSearchResults)
    const searchPromises = yield call(providersService.search, action.searchTerm)
    const searchResults = yield all(searchPromises)
    for (const result in searchResults) {
      yield put({type: types.SEARCH_FULLFILLED, result: searchResults[result]})
      yield put({type: types.ADD_TO_COLLECTION, data: searchResults[result]})
    }
  } catch (e) {
    yield put({type: types.SEARCH_REJECTED, message: e.message})
  }
  yield put({type: types.SEARCH_FINISHED, searchTerm: action.searchTerm})
}

// Going to home page
export function* goToSearchResults(): any {
  yield history.push('/search-results')
}

// Extract settings from state
export const getSettings = (state: any) => {
  return state ? state.settings.settings : {providers: {}}
}

// Binding actions to sagas
function* searchSaga(): any {
  yield takeLatest(types.START_SEARCH, search)
}

export default searchSaga
