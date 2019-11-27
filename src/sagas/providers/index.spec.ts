import { expectSaga } from 'redux-saga-test-plan'
import * as matchers from 'redux-saga-test-plan/matchers'

import { scanFolder } from '../../services/Ipfs/IpfsService'
import { startFolderScan } from './index'

describe('startFolderScan', () => {
  it('fails', () => {
    const hash = 'hash'
    const settings = {
      settings: {
        settings: {
          app: {
            ipfs: {}
          }
        }
      }
    }

    return expectSaga(startFolderScan, hash)
      .withState(settings)
      .provide([
        [matchers.call.fn(scanFolder), []]
      ])
      .run()
  })
})
