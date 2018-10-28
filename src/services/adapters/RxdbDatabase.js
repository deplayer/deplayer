import RxDB from 'rxdb'

RxDB.plugin(require('pouchdb-adapter-idb'));

const collections = [
  {
    name: 'settings',
    schema: {
      title: 'settings schema',
      version: 0,
      type: 'object',
      migrationStrategies: {
      },
      properties: {
        providers: {
          type: 'object'
        }
      },
    }
  }
];

let dbPromise = null;

const _create = async () => {
  // console.log('DatabaseService: deleting previous database..')
  // await RxDB.removeDatabase('settings', 'idb');
  console.log('DatabaseService: creating database..')
  const db = await RxDB.create({name: 'settings', adapter: 'idb'})
  console.log('DatabaseService: created database')
  window['db'] = db; // write to window for debugging

  // create collections
  console.log('DatabaseService: create collections')
  await Promise.all(collections.map(colData => db.collection(colData)))

  return db
}

export const get = () => {
    if (!dbPromise) {
      dbPromise = _create();
    }

    return dbPromise;
}