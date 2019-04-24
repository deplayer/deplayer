import {
  call,
  put,
  putResolve,
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

// Handle every provider as independent thread
function* performSingleSearch(searchTerm: string, provider: string) {
  try {
    const settings = yield select(getSettings)
    const providerService= new ProvidersService(settings)
    const searchResults = yield providerService.searchForProvider(searchTerm, provider)
    yield putResolve({type: types.ADD_TO_COLLECTION, data: searchResults})
  } catch (e) {
    yield put({type: types.SEARCH_REJECTED, message: e.message})
    yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.search.failed'})
  }
  yield call(goToSearchResults)
}

// Handling search saga
export function* search(action: SearchAction): any {
  const settings = yield select(getSettings)
  const providersService = new ProvidersService(settings)
  const searchPromises = yield Object.keys(providersService.providers).map((provider) => {
    return call(performSingleSearch, action.searchTerm, provider)
  })
  yield all(searchPromises)
  yield put({type: types.SEARCH_FINISHED, searchTerm: action.searchTerm})
  yield put({type: types.SEND_NOTIFICATION, notification: 'notifications.search.finished'})
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
