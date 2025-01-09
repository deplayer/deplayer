import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga/effects'
import { describe, it } from 'vitest'
import { fetchSongMetadata } from '../artist'
import * as types from '../../constants/ActionTypes'
import LyricsovhProvider from '../../providers/LyricsovhProvider'
import LyricsService from '../../services/LyricsService'
import { getAdapter } from '../../services/database'
import { State } from '../../reducers'

describe('artist saga', () => {
  const adapter = getAdapter()
  const lyricsService = new LyricsService(adapter)
  const mockSong = {
    id: '123',
    artist: { name: 'Test Artist' },
    title: 'Test Song'
  }

  const mockState = {
    collection: {
      rows: {
        '123': mockSong
      }
    }
  }

  describe('fetchSongMetadata', () => {
    it('should fetch lyrics from local storage if available', () => {
      const storedLyrics = { id: '123', mediaId: '123', lyrics: 'Stored lyrics' }

      return expectSaga(fetchSongMetadata, { type: types.FETCH_LYRICS, songId: '123' })
        .withState(mockState)
        .provide([
          [call(lyricsService.get.bind(lyricsService), '123'), storedLyrics]
        ])
        .put({ type: types.LYRICS_FOUND, data: storedLyrics.lyrics })
        .run()
    })

    it('should fetch lyrics from API if not in local storage', () => {
      const apiResponse = { data: { lyrics: 'API lyrics' } }
      const mbProvider = new LyricsovhProvider()

      return expectSaga(fetchSongMetadata, { type: types.FETCH_LYRICS, songId: '123' })
        .withState(mockState)
        .provide([
          [call(lyricsService.get.bind(lyricsService), '123'), null],
          [call(mbProvider.searchLyrics.bind(mbProvider), mockSong), apiResponse],
          [call(lyricsService.save.bind(lyricsService), '123', apiResponse.data.lyrics), null]
        ])
        .put({ type: types.LYRICS_FOUND, data: apiResponse.data.lyrics })
        .run()
    })

    it('should handle errors gracefully when song is not found', () => {
      const emptyState = {
        collection: {
          rows: {}
        }
      }

      return expectSaga(fetchSongMetadata, { type: types.FETCH_LYRICS, songId: '123' })
        .withState(emptyState)
        .put({ type: types.NO_LYRICS_FOUND, error: 'Song not found' })
        .run()
    })

    it('should handle API errors gracefully', () => {
      const error = new Error('Failed to fetch lyrics')
      const mbProvider = new LyricsovhProvider()

      return expectSaga(fetchSongMetadata, { type: types.FETCH_LYRICS, songId: '123' })
        .withState(mockState)
        .provide([
          [call(lyricsService.get.bind(lyricsService), '123'), null],
          [call(mbProvider.searchLyrics.bind(mbProvider), mockSong), Promise.reject(error)]
        ])
        .put({ type: types.NO_LYRICS_FOUND, error: error.message })
        .run()
    })
  })
}) 