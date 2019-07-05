import RxDB from 'rxdb'
import { IAdapter } from './IAdapter'

export default class DatabaseSyncService {
  storageAdapter: IAdapter

  constructor(storageAdapter: IAdapter) {
    this.storageAdapter = storageAdapter
  }

  setupSync = async (settings: any) => {
    const db = await this.storageAdapter.getDb()

    RxDB.plugin(require('pouchdb-adapter-http'))
    console.log(db)

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

    return replicationState
  }
}
