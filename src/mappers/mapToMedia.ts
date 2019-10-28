import { RxDocument } from 'rxdb'

import rowToSong from './rowToSong'

const mapToMedia = (collection: Array<RxDocument<any, any>>) => {
  if (!collection.length) {
    return []
  }

  return collection.map((elem) => {
    return rowToSong(elem.get())
  })
}

export default mapToMedia
