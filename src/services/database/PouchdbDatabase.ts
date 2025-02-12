import PouchDB from "pouchdb";
import "pouchdb-adapter-idb";

import { createLogger } from "../../utils/logger";

const logger = createLogger({ namespace: "PouchdbDatabase" });

let dbPromise: Promise<any> | null = null;

export const dbName = "player_data";

const createDB = (): any => {
  if (process.env.NODE_ENV === "test") {
    return new PouchDB(dbName);
  } else {
    // return RxDB.create({name: 'player_data', adapter: 'idb'})
    return new PouchDB(dbName, { adapter: "idb" });
  }
};

declare function emit(val: any): void;

const createIndex = async (db: PouchDB.Database) => {
  // document that tells PouchDB/CouchDB
  // to build up an index on doc.name
  var ddoc = {
    _id: "_design/deplayer",
    views: {
      by_type: {
        map: function (doc: { type: String }) {
          emit(doc.type);
        }.toString(),
      },
    },
  };
  // save it
  db.put(ddoc)
    .then(function () {
      logger.info("index created");
    })
    .catch(function (err: Error) {
      // some error (maybe a 409, because it already exists?)
      logger.error("error creating index", err);
    });

  db.query("deplayer/by_type", { limit: 0 });
};

const _create = async (): Promise<PouchDB.Database> => {
  logger.info("DatabaseService", "creating database..");
  const db = createDB();

  logger.debug("pouch object:", db);

  logger.info("DatabaseService", "created database");

  await createIndex(db);

  return db;
};

export const get = () => {
  if (!dbPromise) {
    dbPromise = _create();
  }

  return dbPromise;
};
