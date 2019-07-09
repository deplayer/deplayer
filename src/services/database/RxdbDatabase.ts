import RxDB from 'rxdb'

import Media from '../../entities/Media'
import Artist from '../../entities/Artist'
import logger from '../../utils/logger'

let dbPromise: Promise<any>|null = null

const createDB = (): Promise<any> => {
  if (process.env.NODE_ENV === 'test') {
    return RxDB.create({name: 'player_data', adapter: 'memory'})
  } else {
    return RxDB.create({name: 'player_data', adapter: 'idb'})
  }
}

export const createCollections = async (db: any, filter: Array<string> = []) => {
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
          orderedIds: {
            type: 'array'
          },
          trackIds: {
            type: 'array'
          },
          shuffleEnabled: {
            type: ['boolean']
          },
          repeatEnabled: {
            type: ['boolean']
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
    },
    {
      name: 'playlist',
      schema: {
        title: 'saved playlists',
        version: 0,
        type: 'object',
        properties: {
          trackIds: {
            type: 'array'
          }
        },
      }
    }
  ]

  const filteredCollections = !filter.length ? collections :  collections.filter(({name}) =>
    filter.indexOf(name) >= 0
  )

  // create collections
  logger.log('DatabaseService', 'create collections')
  try {
    await Promise.all(filteredCollections.map(colData =>
      db.collection(colData)
    ))
  } catch(e) {
    logger.log('DatabaseService', 'Error creating collections', e.message)
  }
  logger.log('DatabaseService', 'collections created')
}

const _create = async (): Promise<any> => {
  if (process.env.NODE_ENV === 'test') {
    RxDB.plugin(require('pouchdb-adapter-memory'))
  } else {
    RxDB.plugin(require('pouchdb-adapter-idb'))
  }

  logger.log('DatabaseService', 'creating database..')
  const db = await createDB()
  logger.log('DatabaseService', 'created database')
  window['db'] = db; // write to window for debugging

  await createCollections(db)

  return db
}

export const get = () => {
    if (!dbPromise) {
      dbPromise = _create()
    }

    return dbPromise
}
