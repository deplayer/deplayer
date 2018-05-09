import PouchDB from 'pouchdb'
import pouchdbFind from 'pouchdb-find'
import md5 from 'md5'

PouchDB.plugin(pouchdbFind);
const db = new PouchDB('collection')

// Save playlist items to collection
export const saveCollectionItems = (playlist) => {
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
  return db.allDocs({include_docs: true})
}

export const getSongs = (ids) => {
  const findPromises = []

  ids.forEach((id) => {
    findPromises.push(this.getSon(id))
  })

  return Promise.all(findPromises)
}

export const getSong = (id) => {
  return db.get(id)
}
