import PouchDB from 'pouchdb'
import pouchdbFind from 'pouchdb-find'
import md5 from 'md5'

PouchDB.plugin(pouchdbFind);

// Save playlist items to collection
export const saveCollectionItems = (playlist) => {
  const db = new PouchDB('collection')
  const bulkItems = []
  playlist.forEach((plItem) => {
    plItem._id = md5(plItem.file)
    bulkItems.push(plItem)
  })

  db.bulkDocs(bulkItems)
    .then(() => {
      console.log('Collection saved!')
    })
    .catch((e) => {
      console.error('%j error occurred', e)
    })
}

export const getCollection = () => {
  const db = new PouchDB('collection')

  return db.allDocs({include_docs: true})
}

export const getSong = (id) => {
  const db = new PouchDB('collection')
  return db.get(id)
}

export const getSongs = (ids) => {
  const db = new PouchDB('collection')
  return db.find({
    selector: {_id: {$in: ids}}
  })
}
