import IndexService from '../services/Search/IndexService'
import Song from '../entities/Song'
import filterSongs from './filter-songs'

describe('filterSongs', () => {
  const fixtureSong = new Song({
    forcedId: 'test',
    title: 'test'
  })
  const songs = {test: fixtureSong}

  it('should filter songs', () => {
    const indexService = new IndexService()
    indexService.generateIndexFrom([fixtureSong])
    expect(filterSongs(indexService, songs, 'test')).toEqual(['test'])
  })
})
