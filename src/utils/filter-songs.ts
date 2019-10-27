import IndexService from '../services/Search/IndexService'

const filterSongs = (
  indexService: IndexService,
  songs: any,
  term: string = ''
) => {
  if (term === '') {
    return Object.keys(songs)
  }

  const results = indexService.search(term)

  const mappedResults = results.map((result: any) => {
    return result.ref
  })

  return mappedResults
}

export default filterSongs
