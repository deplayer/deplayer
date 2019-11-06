import { expectSaga } from 'redux-saga-test-plan'

import {
 setCurrentPlaying
} from './index'
import Song from '../../entities/Song'
import * as types from '../../constants/ActionTypes'

describe('setCurrentPlaying', () => {
  it('works', () => {
    const song = new Song({
      forcedId: 'foo',
      stream: [
        {
          service: 'subsonic',
          uris: [{uri: 'https://foo.bar'}]
        }
      ]
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
      .put({type: types.START_PLAYING})
      .run()
  })
})
