import { IAdapter } from './IAdapter'
import  * as types from '../../constants/ActionTypes'
import PouchDB from 'pouchdb'
require('pouchdb-adapter-http')

export default class DatabaseSyncService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  setupSync = async (settings: any, dispatch: any) => {
    // FIXME: Magic string
    const replicationState = PouchDB.sync('player_data', settings.app.databaseSync.remote, { live: true, retry: true })

    const replicatedPayload: Array<any> = []

    replicationState.on('change', (docData: any) => {
      console.log(docData)
      replicatedPayload.push(docData)

      if (replicatedPayload.length >= 100) {
        console.log(replicatedPayload)
        const collection = replicatedPayload.filter((elem) => elem.type === 'media')
        dispatch({type: types.RECEIVE_COLLECTION, data: collection})
        // Emptying payload
        replicatedPayload.length = 0
      }
    })

    return replicationState
  }
}
