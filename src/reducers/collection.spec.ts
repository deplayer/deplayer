import reducer, {defaultState, filterSongs} from './collection'
import { RECEIVE_COLLECTION } from '../constants/ActionTypes'
import Song from '../entities/Song'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual( defaultState)
  })

  it('should handle RECEIVE_COLLECTION', () => {
    const fixtureSong = new Song()
    const rows = {}
    rows[fixtureSong.id] = new Song(fixtureSong)
    const expected = {...defaultState, totalRows: 1, rows, visibleSongs: [fixtureSong.id]}
    expect(reducer(defaultState, {type: RECEIVE_COLLECTION, data: [fixtureSong]}))
      .toEqual(expected)
  })
})

describe('filterSongs', () => {
  const fixtureSong = new Song({
    id: 'test',
    title: 'test'
  })
  const songs = {test: fixtureSong}

  expect(filterSongs(songs, 'test'))
    .toEqual(['test'])
})
