import IndexService from '../services/Search/IndexService'
import Media from '../entities/Media'
import filterSongs from './filter-songs'

describe('filterSongs', () => {
  const fixtureSong = new Media({
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
