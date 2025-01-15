import { takeLatest, call, put, select } from "redux-saga/effects";

import { getSongById, getSettings } from "./../selectors";
import Artist from "../../entities/Artist";
import LyricsovhProvider from "../../providers/LyricsovhProvider";
import MusicbrainzProvider from "../../providers/MusicbrainzProvider";
import * as types from "../../constants/ActionTypes";
import LyricsService from "../../services/LyricsService"
import { getAdapter } from '../../services/database'

type LoadArtistAction = {
  type: string;
  artist: typeof Artist;
};

const adapter = getAdapter()
const lyricsService = new LyricsService(adapter)

type FetchSongMetadataAction = {
  type: string;
  songId: string;
};

export function* fetchSongMetadata(action: FetchSongMetadataAction): any {
  try {
    const song = yield select(getSongById, action.songId);
    if (!song) {
      throw new Error('Song not found');
    }

    const storedLyrics = yield call([lyricsService, 'get'], song.id);

    if (!storedLyrics) {
      const mbProvider = new LyricsovhProvider();
      try {
        const response = yield call([mbProvider, 'searchLyrics'], song);
        const lyrics = response.data.lyrics;
        yield call([lyricsService, 'save'], song.id, lyrics);
        yield put({ type: types.LYRICS_FOUND, data: lyrics });
      } catch (apiError: any) {
        throw new Error(apiError.message || 'Failed to fetch lyrics');
      }
    } else {
      yield put({ type: types.LYRICS_FOUND, data: storedLyrics.lyrics });
    }
  } catch (e: any) {
    yield put({ type: types.NO_LYRICS_FOUND, error: e.message });
  }
}

export function* loadMoreArtistSongsFromProvider(
  action: LoadArtistAction
): any {
  // First dispatch search action to load more songs
  yield put({
    type: types.START_SEARCH,
    searchTerm: action.artist.name,
    noRedirect: true,
  });

  // Then fetch artist metadata from MusicBrainz
  try {
    const settings = yield select(getSettings);
    const mbProvider = new MusicbrainzProvider(settings.providers.musicbrainz || {}, 'musicbrainz');
    
    if (settings.providers.musicbrainz?.enabled) {
      const artistMetadata = yield call([mbProvider, 'searchArtistInfo'], action.artist.name);
      if (artistMetadata) {
        yield put({ type: types.RECEIVE_ARTIST_METADATA, data: artistMetadata });
      }
    }
  } catch (error) {
    console.error('Failed to fetch artist metadata:', error);
  }
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider);
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata);
}

export default artistSaga;
