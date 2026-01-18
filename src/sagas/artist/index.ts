import { call, put, takeLatest } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { getSongByIdFromLiveStore, getSettingsFromLiveStore } from './../selectors'
import MusicbrainzProvider from '../../providers/MusicbrainzProvider'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import { createLogger } from '../../utils/logger'
import { getLiveStoreInstance } from '../../App'
import { addLyricsAction } from '../../stores/livestore/actions/lyrics'
import { queryDb } from '@livestore/livestore'
import { tables } from '../../stores/livestore/schema'

const logger = createLogger({ namespace: 'artist-saga' })

// Simplified artist metadata fetching (no persistence for now)
function* loadMoreArtistSongsFromProvider(action: any): any {
  // Clear existing artist metadata first
  yield put({ type: types.CLEAR_ARTIST_METADATA })

  // First dispatch search action to load more songs
  yield put({ type: types.START_SEARCH, searchTerm: action.artist.name, noRedirect: true })

  // Then fetch artist metadata from MusicBrainz
  const settings = yield call(getSettingsFromLiveStore)
  const artistName = action.artist.name

  try {
    // Note: Artist metadata persistence removed with PGlite migration
    // Fetch from MusicBrainz directly if enabled
    if (settings.providers.musicbrainz?.enabled) {
      const mbProvider = new MusicbrainzProvider(settings.providers.musicbrainz || {}, 'musicbrainz')
      const artistMetadata = yield call([mbProvider, 'searchArtistInfo'], artistName)
      
      if (artistMetadata) {
        yield put({ type: types.RECEIVE_ARTIST_METADATA, data: artistMetadata })
      }
    }
  } catch (error) {
    logger.error('Failed to fetch artist metadata:', error)
  }
}

export function* fetchSongMetadata(action: any): any {
  const song = yield call(getSongByIdFromLiveStore, action.songId)
  if (!song) {
    logger.error('Song not found:', action.songId)
    return
  }

  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    logger.error('LiveStore not available')
    return
  }

  try {
    // Check if lyrics already exist in LiveStore
    const lyricsQuery = queryDb(
      tables.lyrics.select().where('mediaId', '=', song.id).limit(1)
    )
    const storedLyrics = yield call(() => liveStore.query(lyricsQuery))
    
    if (storedLyrics && storedLyrics.length > 0 && storedLyrics[0].lyricsText) {
      logger.debug('Found lyrics in LiveStore')
      // Lyrics already exist, no need to dispatch anything - LiveStore hook will update automatically
      return
    }

    logger.debug('No lyrics in LiveStore, fetching from API for song:', song)
    // If not in LiveStore, try to fetch from API
    const mbProvider = new LyricsovhProvider()
    try {
      const response = yield call([mbProvider, 'searchLyrics'], song)
      logger.debug('API Response:', response)
      
      if (!response || !response.lyrics) {
        throw new Error('No lyrics found in API response')
      }

      // Save to LiveStore
      yield call(addLyricsAction, liveStore, song.id, response.lyrics, 'lyrics.ovh')
      logger.debug('Lyrics saved to LiveStore')
    } catch (apiError: any) {
      logger.error('API Error:', apiError)
      // Lyrics fetch failed - component will show "Loading lyrics..." or error state
    }
  } catch (error: any) {
    logger.error('Error fetching lyrics:', error)
  }
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider)
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata)
}

export default artistSaga
