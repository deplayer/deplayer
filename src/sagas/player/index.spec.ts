import { expectSaga } from 'redux-saga-test-plan'

import {
 setCurrentPlaying
} from './index'
import Media from '../../entities/Media'
import * as types from '../../constants/ActionTypes'

describe('setCurrentPlaying', () => {
  it('works', () => {
    const streamUrl = 'https://foo.bar'
    const streams = [
      {
        service: 'subsonic',
        uris: [{uri: streamUrl}]
      }
    ]

    const song = new Media({
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
      .put({type: types.PUSH_TO_VIEW, song: action.songId})
      .put({type: types.SET_CURRENT_PLAYING_URL, url: streamUrl})
      .put({type: types.SET_CURRENT_PLAYING_STREAMS, streams: streams})
      .put({type: types.START_PLAYING})
      .run()
  })
})
