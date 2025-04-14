import { call, put, select, takeLatest } from 'redux-saga/effects'
import * as types from '../../constants/ActionTypes'
import { getSongById, getSettings } from './../selectors'
import MusicbrainzProvider from '../../providers/MusicbrainzProvider'
import ArtistService from '../../services/ArtistService'
import LyricsService from '../../services/LyricsService'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import { getAdapter } from '../../services/database'
import { media } from '../../schema'
import { eq } from 'drizzle-orm'
import { createLogger } from '../../utils/logger'

const logger = createLogger({ namespace: 'artist-saga' })

// Service interfaces for better testability
export interface ILyricsRepository {
  getLyrics(songId: string): Promise<{ lyrics: string } | null>
  saveLyrics(songId: string, lyrics: string): Promise<void>
  ensureSongExists(song: any): Promise<void>
}

interface IArtistRepository {
  getMetadata(artistName: string): Promise<any>
  saveMetadata(artistName: string, metadata: any): Promise<void>
}

// Default implementations (can be imported from separate files)
class DefaultLyricsRepository implements ILyricsRepository {
  constructor(private adapter: any, private lyricsService: any) {}

  async getLyrics(songId: string) {
    return this.lyricsService.get(songId)
  }

  async saveLyrics(songId: string, lyrics: string) {
    return this.lyricsService.save(songId, lyrics)
  }

  async ensureSongExists(song: any) {
    const db = await this.adapter.getDb()
    const existingSong = await db.select().from(media).where(eq(media.id, song.id))

    if (!existingSong || existingSong.length === 0) {
      logger.debug('Song not in database, saving it first...')
      await db.insert(media).values({
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
  }
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
  const settings = yield select(getSettings)
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

export function* fetchSongMetadata(
  action: any,
  lyricsRepo: ILyricsRepository = new DefaultLyricsRepository(getAdapter(), new LyricsService(getAdapter()))
): any {
  const song = yield select(getSongById, action.songId)
  if (!song) {
    yield put({ type: types.NO_LYRICS_FOUND, error: 'Song not found' })
    return
  }

  try {
    // First ensure the song exists in the database
    yield call([lyricsRepo, 'ensureSongExists'], song)

    // Now try to get lyrics from database
    const storedLyrics = yield call([lyricsRepo, 'getLyrics'], song.id)
    logger.debug('Database response:', storedLyrics)

    // Check if we actually have lyrics in the database
    if (storedLyrics && storedLyrics.lyrics) {
      logger.debug('Found lyrics in database:', storedLyrics)
      yield put({ type: types.LYRICS_FOUND, data: storedLyrics.lyrics })
      return
    }

    logger.debug('No lyrics in database, fetching from API for song:', song)
    // If not in database, try to fetch from API
    const mbProvider = new LyricsovhProvider()
    try {
      const response = yield call([mbProvider, 'searchLyrics'], song)
      logger.debug('API Response:', response)
      
      if (!response || !response.lyrics) {
        throw new Error('No lyrics found in API response')
      }

      // Save to database
      yield call([lyricsRepo, 'saveLyrics'], song.id, response.lyrics)
      yield put({ type: types.LYRICS_FOUND, data: response.lyrics })
    } catch (apiError: any) {
      logger.error('API Error:', apiError)
      // Handle API-specific errors
      yield put({ 
        type: types.NO_LYRICS_FOUND, 
        error: apiError.message || 'Failed to fetch lyrics from provider'
      })
    }
  } catch (error: any) {
    logger.error('Database Error:', error)
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

