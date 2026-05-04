import { expectSaga } from 'redux-saga-test-plan'
import { describe, it, vi } from 'vitest'
import {
  setCurrentPlaying
} from './index'
import type { MediaRow } from '../../types/media'
import * as types from '../../constants/ActionTypes'
import { SetCurrentPlayingAction } from './index'

const IdbKevalMock = vi.fn(() => ({
  open: vi.fn()
}))

vi.stubGlobal('idb-keyval', IdbKevalMock)

describe('setCurrentPlaying', async () => {
  it('works', () => {
    const streamUrl = 'https://foo.bar'
    const streams = {
      subsonic: {
        service: 'subsonic',
        uris: [{ uri: streamUrl }]
      }
    }

    const song: MediaRow = {
      id: 'foo',
      title: 'Test Song',
      artistId: 'test-artist',
      albumId: 'test-album',
      artistName: 'Test Artist',
      albumName: 'Test Album',
      type: 'audio',
      duration: 180,
      playCount: 0,
      track: null,
      discNumber: null,
      stream: streams,
      cover: null,
      genres: [],
      externalId: null,
      shareUrl: null,
      filePath: null,
      genresFlat: '',
      providersFlat: 'subsonic',
    }

    const state = {
      collection: {
        rows: {
          foo: song
        }
      },
      queue: {},
      settings: {
        settings: {
          app: {
            ipfs: {
              port: 0,
              host: '',
              proto: ''
            }
          }
        }
      }
    }
    const action = {
      type: types.SET_CURRENT_PLAYING,
      songId: 'foo',
      url: streamUrl,
      media: song
    } as SetCurrentPlayingAction

    return expectSaga(setCurrentPlaying, action)
      .withState(state)
      .put({ type: types.PUSH_TO_VIEW, song: action.songId })
      .put({ type: types.SET_CURRENT_PLAYING_URL, url: streamUrl })
      .put({ type: types.SET_CURRENT_PLAYING_STREAMS, streams: streams })
      .run()
  })
})
