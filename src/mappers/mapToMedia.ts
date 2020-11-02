import rowToSong from './rowToSong'

const mapToMedia = (collection: Array<any>) => {
  if (!collection.length) {
    return []
  }

  return collection.map((elem) => {
    return rowToSong(elem.get())
  })
}

export default mapToMedia
