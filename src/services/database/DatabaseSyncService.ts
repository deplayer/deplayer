import RxDB from 'rxdb'

import { IAdapter } from './IAdapter'
import  * as types from '../../constants/ActionTypes'

export default class DatabaseSyncService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  setupSync = async (settings: any, dispatch: any) => {
    const db = await this.storageAdapter.getDb()

    RxDB.plugin(require('pouchdb-adapter-http'))

    const collection = db['media']

    const replicationState = collection.sync({
      remote: settings.app.databaseSync.remote,
      waitForLeadership: true,
      direction: {
        pull: true,
        push: true
      },
      options: {
        live: true,
        retry: true
      }
    })

    const replicatedPayload: Array<any> = []

    replicationState.docs$.subscribe((docData: any) => {
      replicatedPayload.push(docData)

      if (replicatedPayload.length >= 100) {
        dispatch({type: types.RECEIVE_COLLECTION, data: replicatedPayload})
        // Emptying payload
        replicatedPayload.length = 0
      }
    })

    return replicationState
  }
}
