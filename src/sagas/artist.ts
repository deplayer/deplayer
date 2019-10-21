import { takeLatest, putResolve, put, select } from 'redux-saga/effects'

import { getSettings } from './selectors'
import Artist from '../entities/Artist'
import LastfmProvider from '../providers/LastfmProvider'
import * as types from '../constants/ActionTypes'

type LoadArtistAction = {
  type: string,
  artist: Artist
}

export function* fetchArtistMetadata(action: LoadArtistAction): any {
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

export function* loadMoreArtistSongsFromProvider(action: LoadArtistAction): any {
  yield put({
    type: types.START_SEARCH,
    searchTerm: action.artist.name,
    noRedirect: true
  })
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, fetchArtistMetadata)
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider)
}

export default artistSaga
