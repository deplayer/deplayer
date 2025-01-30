import { call, put, select, takeLatest } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { getSongById, getSettings } from './../selectors'
import MusicbrainzProvider from '../../providers/MusicbrainzProvider'
import ArtistService from '../../services/ArtistService'
import LyricsService from '../../services/LyricsService'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import { getAdapter } from '../../services/database'

const artistService = new ArtistService()
const adapter = getAdapter()
const lyricsService = new LyricsService(adapter)

export function* loadMoreArtistSongsFromProvider(action: any): any {
  // Clear existing artist metadata first
  yield put({ type: types.CLEAR_ARTIST_METADATA })

  // First dispatch search action to load more songs
  yield put({ type: types.START_SEARCH, searchTerm: action.artist.name, noRedirect: true })

  // Then fetch artist metadata from database or MusicBrainz
  const settings = yield select(getSettings)
  const artistName = action.artist.name

  try {
    // Try to get metadata from database first
    const storedMetadata = yield call([artistService, 'get'], artistName)
    
    if (storedMetadata) {
      yield put({ type: types.RECEIVE_ARTIST_METADATA, data: storedMetadata })
      return
    }

    // If not in database and MusicBrainz is enabled, fetch from there
    if (settings.providers.musicbrainz?.enabled) {
      const mbProvider = new MusicbrainzProvider(settings.providers.musicbrainz || {}, 'musicbrainz')
      const artistMetadata = yield call([mbProvider, 'searchArtistInfo'], artistName)
      
      if (artistMetadata) {
        // Save metadata to database
        yield call([artistService, 'save'], artistName, artistMetadata)
        yield put({ type: types.RECEIVE_ARTIST_METADATA, data: artistMetadata })
      }
    }
  } catch (error) {
    console.error('Failed to fetch artist metadata:', error)
  }
}

export function* fetchSongMetadata(action: any): any {
  const song = yield select(getSongById, action.songId)
  if (!song) {
    yield put({ type: types.NO_LYRICS_FOUND, error: 'Song not found' })
    return
  }

  try {
    // First try to get lyrics from database
    const storedLyrics = yield call([lyricsService, 'get'], song.id)
    console.log('Database response:', storedLyrics)

    // Check if we actually have lyrics in the database
    if (storedLyrics && storedLyrics.lyrics) {
      console.log('Found lyrics in database:', storedLyrics)
      yield put({ type: types.LYRICS_FOUND, data: storedLyrics.lyrics })
      return
    }

    console.log('No lyrics in database, fetching from API for song:', song)
    // If not in database, try to fetch from API
    const mbProvider = new LyricsovhProvider()
    try {
      const response = yield call([mbProvider, 'searchLyrics'], song)
      console.log('API Response:', response)
      
      if (!response || !response.lyrics) {
        throw new Error('No lyrics found in API response')
      }

      // Save to database
      yield call([lyricsService, 'save'], song.id, response.lyrics)
      yield put({ type: types.LYRICS_FOUND, data: response.lyrics })
    } catch (apiError: any) {
      console.error('API Error:', apiError)
      // Handle API-specific errors
      yield put({ 
        type: types.NO_LYRICS_FOUND, 
        error: apiError.message || 'Failed to fetch lyrics from provider'
      })
    }
  } catch (error: any) {
    console.error('Database Error:', error)
    // Handle database errors
    yield put({ 
      type: types.NO_LYRICS_FOUND, 
      error: `Database error: ${error.message}` 
    })
  }
}

// Binding actions to sagas
function* artistSaga(): any {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider)
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata)
}

export default artistSaga

