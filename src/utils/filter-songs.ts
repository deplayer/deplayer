import indexSingleton, { IndexService } from '../services/Search/IndexService'

const filterSongs = (
  indexService: IndexService = indexSingleton(),
  songs: any,
  term: string = ''
) => {
  if (!songs) {
    []
  }

  if (term === '' && songs) {
    return Object.keys(songs)
  }

  const results = indexService.search(term)

  const mappedResults = results.map((result: any) => {
    return result.ref
  })

  return mappedResults
}

export default filterSongs
