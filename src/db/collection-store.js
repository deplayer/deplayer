import PouchDB from 'pouchdb'
import md5 from 'md5'

// Save playlist items to collection
const saveCollectionItems = (playlist) => {
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

export default saveCollectionItems
