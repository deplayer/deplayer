import { takeLatest, putResolve, put, select } from 'redux-saga/effects'

import * as types from '../constants/ActionTypes'
import { getSettings } from './selectors'
import LastfmProvider from '../providers/LastfmProvider'

export function* fetchArtistMetadata(action: any): any {
  const { app: { lastfm } } = yield select(getSettings)

  try {
    const providerService = new LastfmProvider({
      enabled: lastfm ? lastfm.enabled : false,
      apikey: lastfm ? lastfm.apikey : '',
    },'lastfm')

    const artistMetadata = yield providerService.searchArtistInfo(
      action.artist.name
    )
    yield putResolve({type: types.RECEIVE_ARTIST_METADATA, data: artistMetadata})
  } catch(e) {
    yield put({type: types.NO_ARTIST_NAME, error: e})
  }
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, fetchArtistMetadata)
}

export default artistSaga
