import filterSongs from './filter-songs'
import Song from '../entities/Song'

describe('filterSongs', () => {
  const fixtureSong = new Song({
    id: 'test',
    title: 'test'
  })
  const songs = {test: fixtureSong}

  it('should filter songs', () => {
    expect(filterSongs(songs, 'test')).toEqual(['test'])
  })
})
