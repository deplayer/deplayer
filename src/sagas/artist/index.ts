import { call, put, takeLatest } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { getSongByIdFromLiveStore, getSettingsFromLiveStore } from './../selectors'
import MusicbrainzProvider from '../../providers/MusicbrainzProvider'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import { createLogger } from '../../utils/logger'
import { getLiveStoreInstance } from '../../App'
import { addLyricsAction } from '../../stores/livestore/actions/lyrics'
import { addMediaBulkAction } from '../../stores/livestore/actions/media'
import { queryDb } from '@livestore/livestore'
import { tables } from '../../stores/livestore/schema'
import ProvidersService from '../../services/ProvidersService'
import { IMusicProvider } from '../../providers/IMusicProvider'

const logger = createLogger({ namespace: 'artist-saga' })

// Simplified artist metadata fetching (no persistence for now)
function* loadMoreArtistSongsFromProvider(action: { type: string; artist: { name: string } }): Generator<any, void, any> {
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

export function* fetchSongMetadata(action: { type: string; songId: string }): Generator<any, void, any> {
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
      yield call(() => addLyricsAction(liveStore as unknown as Parameters<typeof addLyricsAction>[0], song.id, response.lyrics, 'lyrics.ovh'))
      logger.debug('Lyrics saved to LiveStore')
    } catch (apiError: unknown) {
      logger.error('API Error:', apiError)
      // Lyrics fetch failed - component will show "Loading lyrics..." or error state
    }
  } catch (error: unknown) {
    logger.error('Error fetching lyrics:', error)
  }
}

// Fetch songs for an artist from all enabled providers
function* fetchArtistSongsFromProvider(action: { type: string; artist: { name: string } }): Generator<any, void, any> {
  const artistName = action.artist?.name
  if (!artistName) {
    logger.debug('No artist name provided')
    return
  }

  try {
    const settings = yield call(getSettingsFromLiveStore)
    if (!settings?.providers) {
      logger.debug('No providers configured')
      return
    }

    const providersService = new ProvidersService(settings)
    const liveStore = getLiveStoreInstance()

    if (!liveStore) {
      logger.error('LiveStore not available')
      return
    }

    // Call each enabled provider that supports getArtistSongs
    for (const provider of Object.values(providersService.providers) as IMusicProvider[]) {
      if (provider.getArtistSongs) {
        try {
          logger.debug(`Fetching songs for ${artistName} from ${provider.providerKey}`)
          const songs = yield call([provider, provider.getArtistSongs], artistName)

          if (songs?.length > 0) {
            logger.debug(`Found ${songs.length} songs, merging into LiveStore`)
            yield call(addMediaBulkAction, liveStore, songs)
          }
        } catch (error) {
          // Silent failure - just log and continue to next provider
          logger.debug(`Failed to fetch from ${provider.providerKey}:`, error)
        }
      }
    }
  } catch (error) {
    logger.error('Error in fetchArtistSongsFromProvider:', error)
  }
}

// Binding actions to sagas
function* artistSaga(): Generator<any, void, any> {
  yield takeLatest(types.LOAD_ARTIST, loadMoreArtistSongsFromProvider)
  yield takeLatest(types.FETCH_ARTIST_SONGS, fetchArtistSongsFromProvider)
  yield takeLatest(types.FETCH_LYRICS, fetchSongMetadata)
}

export default artistSaga
