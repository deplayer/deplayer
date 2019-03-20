import IndexService from '../services/Search/IndexService'

const getKeys = (rows: any): Array<string> => {
  return Object.keys(rows)
}

const filterSongs = (songs: any, term: string) => {
  if (!term || term === '') {
    return Object.keys(songs)
  }

  const songsArray = getKeys(songs).map((key) => {
    return songs[key]
  })

  // TODO: Save, cache and load index from db
  const indexService = new IndexService()
  const results = indexService
    .generateIndexFrom(songsArray)
    .search(term)

  const mappedResults = results.map((result) => {
    return result.ref
  })

  return mappedResults
}

export default filterSongs
