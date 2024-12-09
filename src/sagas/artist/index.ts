import { takeLatest, call, put, select } from "redux-saga/effects";

import { getSongById } from "./../selectors";
import Artist from "../../entities/Artist";
import LyricsovhProvider from "../../providers/LyricsovhProvider";
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
  const song = yield select(getSongById, action.songId);

  try {
    const lyrics = yield call(lyricsService.get, song.id) 

    if (!lyrics) {
      const mbProvider = new LyricsovhProvider();
      const lyrics = yield call(mbProvider.searchLyrics, song);
      yield call(lyricsService.save, song.id, lyrics.data.lyrics)
    }

    yield put({ type: types.LYRICS_FOUND, data: lyrics.data.lyrics });
  } catch (e: any) {
    yield put({ type: types.NO_LYRICS_FOUND, error: e.message });
  }
}

export function* loadMoreArtistSongsFromProvider(
  action: LoadArtistAction
): any {
  yield put({
    type: types.START_SEARCH,
    searchTerm: action.artist.name,
    noRedirect: true,
  });
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider);
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata);
}

export default artistSaga;
