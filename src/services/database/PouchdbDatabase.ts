import PouchDB from 'pouchdb'
import 'pouchdb-adapter-idb'

import Media from '../../entities/Media'
import Artist from '../../entities/Artist'
import logger from '../../utils/logger'

let dbPromise: Promise<any> | null = null

export const dbName = 'player_data'

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
        repeat: {
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
  },
  {
    name: 'appcache',
    schema: {
      title: 'redux store cache',
      version: 0,
      type: 'object',
      properties: {
        state: {
          type: 'object'
        }
      },
    }
  }
]

const createDB = (): any => {
  if (process.env.NODE_ENV === 'test') {
    return new PouchDB(dbName)
  } else {
    // return RxDB.create({name: 'player_data', adapter: 'idb'})
    return new PouchDB(dbName, { adapter: 'idb' })
  }
}

declare function emit(val: any)

const createIndex = async (db) => {
  // document that tells PouchDB/CouchDB
  // to build up an index on doc.name
  var ddoc = {
    _id: '_design/deplayer',
    views: {
      by_type: {
        map: function(doc) {
          emit(doc.type);
        }.toString()
      }
    }
  };
  // save it
  db.put(ddoc).then(function() {
    console.log('index crated')
  }).catch(function(err) {
    // some error (maybe a 409, because it already exists?)
    console.log('error creating index', err)
  });

  db.query(
    'deplayer/by_type',
    { limit: 0 }
  )
}

export const createCollections = async (db: any, filter: Array<string> = []) => {
  const filteredCollections = !filter.length ? collections : collections.filter(({ name }) =>
    filter.indexOf(name) >= 0
  )

  // create collections
  logger.log('DatabaseService', 'create database collections')
  try {
    await Promise.all(filteredCollections.map(async (colData) =>
      await db.collection(colData)
    ))
  } catch (e) {
    logger.log('DatabaseService', 'Error creating collections', e.message)
  }
  logger.log('DatabaseService', 'database collections created')
}

const _create = async (): Promise<any> => {

  logger.log('DatabaseService', 'creating database..')
  const db = createDB()

  console.log('pouch object:', db)

  logger.log('DatabaseService', 'created database')
  window['db'] = db; // write to window for debugging

  // await createCollections(db)
  await createIndex(db)

  return db
}

export const get = () => {
  if (!dbPromise) {
    dbPromise = _create()
  }

  return dbPromise
}
