import RxDB from 'rxdb'

import Media from '../../entities/Media'
import Artist from '../../entities/Artist'

const collections: Array<any> = [
  {
    name: 'settings',
    schema: {
      title: 'settings schema',
      version: 0,
      type: 'object',
      properties: {
        providers: {
          type: 'object'
        },
        app: {
          type: 'object'
        }
      },
      migrationStrategies: {
      }
    }
  },
  {
    name: 'search_index',
    schema: {
      title: 'search_index',
      version: 0,
      type: 'object',
      migrationStrategies: {
      },
      properties: {
        index: {
          type: 'object'
        }
      },
    }
  },
  {
    name: 'queue',
    schema: {
      title: 'playing queue',
      version: 0,
      type: 'object',
      migrationStrategies: {
      },
      properties: {
        trackIds: {
          type: 'array'
        },
        currentPlaying: {
          type: ['string', 'null']
        },
        nextSongId: {
          type: ['string', 'null']
        },
        prevSongId: {
          type: ['string', 'null']
        }
      },
    }
  },
  {
    name: 'media',
    schema: {
      title: 'collection schema',
      version: 0,
      type: 'object',
      properties: Media.toSchema()
    }
  },
  {
    name: 'artist',
    schema: {
      title: 'media artists',
      version: 0,
      type: 'object',
      properties: Artist.toSchema()
    }
  }
]

let dbPromise: Promise<any>|null = null

const createDB = (): Promise<any> => {
  if (process.env.NODE_ENV === 'test') {
    return RxDB.create({name: 'player_data', adapter: 'memory'})
  } else {
    return RxDB.create({name: 'player_data', adapter: 'idb'})
  }
}

const _create = async (): Promise<any> => {
  if (process.env.NODE_ENV === 'test') {
    RxDB.plugin(require('pouchdb-adapter-memory'))
  } else {
    RxDB.plugin(require('pouchdb-adapter-idb'))
  }

  // console.log('DatabaseService: deleting previous database..')
  // await RxDB.removeDatabase('settings', 'idb');
  console.log('DatabaseService: creating database..')
  const db = await createDB()
  console.log('DatabaseService: created database')
  window['db'] = db; // write to window for debugging

  // create collections
  console.log('DatabaseService: create collections')
  await Promise.all(collections.map(colData => db.collection(colData)))
  console.log('DatabaseService: collections created')

  return db
}

export const get = () => {
    if (!dbPromise) {
      dbPromise = _create()
    }

    return dbPromise
}
