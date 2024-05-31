const filterSongs = (
  songs: any,
  term: string = ''
) => {
  if (!songs) {
    []
  }

  if (term === '') {
    return Object.keys(songs)
  }

  // FIXME: Recover this
  // const results = indexService.search(term)
  const results = []

  const mappedResults = results.map((result: any) => {
    return result.ref
  })

  return mappedResults
}

export default filterSongs
