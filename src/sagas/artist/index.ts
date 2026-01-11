import { call, put, select, takeLatest } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { getSongById, getSettingsFromLiveStore } from './../selectors'
import MusicbrainzProvider from '../../providers/MusicbrainzProvider'
import ArtistService from '../../services/ArtistService'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import { getAdapter } from '../../services/database'
import { media } from '../../schema'
import { eq } from 'drizzle-orm'
import { createLogger } from '../../utils/logger'
import { getLiveStoreInstance } from '../../App'
import { addLyricsAction } from '../../stores/livestore/actions/lyrics'
import { queryDb } from '@livestore/livestore'
import { tables } from '../../stores/livestore/schema'

const logger = createLogger({ namespace: 'artist-saga' })

interface IArtistRepository {
  getMetadata(artistName: string): Promise<any>
  saveMetadata(artistName: string, metadata: any): Promise<void>
}

class DefaultArtistRepository implements IArtistRepository {
  constructor(private artistService: any) {}

  async getMetadata(artistName: string) {
    return this.artistService.get(artistName)
  }

  async saveMetadata(artistName: string, metadata: any) {
    return this.artistService.save(artistName, metadata)
  }
}

// Create default instances
const artistService = new ArtistService()
const defaultArtistRepo = new DefaultArtistRepository(artistService)

function* loadMoreArtistSongsFromProvider(
  action: any,
  artistRepo: IArtistRepository = defaultArtistRepo
): any {
  // Clear existing artist metadata first
  yield put({ type: types.CLEAR_ARTIST_METADATA })

  // First dispatch search action to load more songs
  yield put({ type: types.START_SEARCH, searchTerm: action.artist.name, noRedirect: true })

  // Then fetch artist metadata from database or MusicBrainz
  const settings = yield call(getSettingsFromLiveStore)
  const artistName = action.artist.name

  try {
    // Try to get metadata from database first
    const storedMetadata = yield call([artistRepo, 'getMetadata'], artistName)
    
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
        yield call([artistRepo, 'saveMetadata'], artistName, artistMetadata)
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
    logger.error('Song not found:', action.songId)
    return
  }

  const liveStore = getLiveStoreInstance()
  if (!liveStore) {
    logger.error('LiveStore not available')
    return
  }

  try {
    // First ensure the song exists in the database
    const adapter = getAdapter()
    const db = yield call([adapter, 'getDb'])
    const existingSong = yield call([db, 'select'], { from: media, where: eq(media.id, song.id) })

    if (!existingSong || existingSong.length === 0) {
      logger.debug('Song not in database, saving it first...')
      yield call([db, 'insert'], media, {
        id: song.id,
        title: song.title,
        artist: song.artist,
        type: song.type,
        album: song.album,
        cover: song.cover || null,
        stream: song.stream,
        duration: song.duration,
        playCount: 0,
        genres: song.genres || [],
        track: song.track || null,
        discNumber: song.discNumber || null,
        year: song.year || null,
        searchableText: `${song.title} ${song.artist.name} ${song.album.name}`,
      })
    }

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
      // Lyrics fetch failed - component will show "Loading lyrics..." indefinitely or we can add error state
      // For now, just log the error
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

