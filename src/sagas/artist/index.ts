import { takeLatest, putResolve, call, put, select } from 'redux-saga/effects'

import { getSettings, getCurrentSong } from './../selectors'
import Artist from '../../entities/Artist'
import LastfmProvider from '../../providers/LastfmProvider'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import MusicbrainzProvider from '../../providers/MusicbrainzProvider'
import * as types from '../../constants/ActionTypes'

type LoadArtistAction = {
  type: string,
  artist: typeof Artist
}

export function* fetchSongMetadata(_action: LoadArtistAction): any {
  const song = yield select(getCurrentSong)

  try {
    const mbProvider = new LyricsovhProvider()
    const lyrics = yield call(mbProvider.searchLyrics, song)
    yield put({type: types.LYRICS_FOUND, data: lyrics.data.lyrics})

  } catch(e) {
    yield put({type: types.NO_LYRICS_FOUND, error: e})
  }
}

export function* fetchArtistMetadata(action: LoadArtistAction): any {
  const { app: { lastfm } } = yield select(getSettings)

  try {
    const mbProvider = new MusicbrainzProvider(getSettings, 'musicbrainz')
    const musicbrainzData = yield call(mbProvider.searchArtistInfo, action.artist.name)
    yield putResolve({type: types.RECEIVE_ARTIST_METADATA, data: musicbrainzData})

    const providerService = new LastfmProvider({
      enabled: lastfm ? lastfm.enabled : false,
      apikey: lastfm ? lastfm.apikey : '',
    },'lastfm')

    const artistMetadata = yield call(providerService.searchArtistInfo, action.artist.name)
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
  yield takeLatest(types.START_PLAYING, fetchSongMetadata)
}

export default artistSaga
