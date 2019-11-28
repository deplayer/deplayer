import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import { defaultState } from '../../reducers/settings'
import {
  getFileMetadata,
  metadataToSong
} from '../../services/ID3Tag/ID3TagService'
import { getSettings } from '../selectors'
import { scanFolder } from '../../services/Ipfs/IpfsService'
import { startFolderScan, handleIPFSFileLoad } from './index'
import Song from '../../entities/Song'
import  * as types from '../../constants/ActionTypes'

describe('startFolderScan', () => {
  it('fails', () => {
    const hash = 'hash'
    return expectSaga(startFolderScan, hash)
      .withState(defaultState)
      .provide([
        [matchers.call.fn(scanFolder), []]
      ])
      .run()
  })
})

describe('handleIPFSFileLoad', () => {
  it('should work', () => {
    const dummySong = {
      metadata: {
        common: {
          title: 'Song metadata title'
        }
      }
    }
    const resultSong = new Song()

    return expectSaga(handleIPFSFileLoad)
      .withState(defaultState)
      .provide([
        [matchers.call.fn(getFileMetadata), dummySong],
        [matchers.call.fn(metadataToSong), resultSong]
      ])
      .dispatch({type: types.IPFS_FILE_FOUND})
      .put({ type: types.IPFS_SONG_SAVED, song: resultSong })
      .run()
  })
})
