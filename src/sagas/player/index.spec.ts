import { expectSaga } from 'redux-saga-test-plan'
import { describe, it, vi } from 'vitest'

import {
  setCurrentPlaying
} from './index'
import Media from '../../entities/Media'
import { mediaParams } from '../../entities/Media.spec'
import * as types from '../../constants/ActionTypes'

const IdbKevalMock = vi.fn(() => ({
  open: vi.fn()
}))

vi.stubGlobal('idb-keyval', IdbKevalMock)


describe('setCurrentPlaying', () => {
  it('works', () => {
    const streamUrl = 'https://foo.bar'
    const streams = [
      {
        service: 'subsonic',
        uris: [{ uri: streamUrl }]
      }
    ]

    const song = new Media({
      ...mediaParams,
      forcedId: 'foo',
      stream: streams
    })
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
      songId: 'foo'
    }
    return expectSaga(setCurrentPlaying, action)
      .withState(state)
      .put({ type: types.PUSH_TO_VIEW, song: action.songId })
      .put({ type: types.SET_CURRENT_PLAYING_URL, url: streamUrl })
      .put({ type: types.SET_CURRENT_PLAYING_STREAMS, streams: streams })
      .put({ type: types.START_PLAYING })
      .run()
  })
})
