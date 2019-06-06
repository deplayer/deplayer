import { takeLatest, select, putResolve } from 'redux-saga/effects'

import * as types from '../constants/ActionTypes'
import ArtistMetadataProviders from '../services/ArtistMetadataProviders'
import { getSettings } from './selectors'

export function* fetchArtistMetadata(action: any): any {
  const settings = yield select(getSettings)
  const providerService = new ArtistMetadataProviders(settings)
  const artistMetadata = yield providerService.search(action.artist.name)
  yield putResolve({type: types.RECEIVE_ARTIST_METADATA, data: artistMetadata})
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, fetchArtistMetadata)
}

export default artistSaga
