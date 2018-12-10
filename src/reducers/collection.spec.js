// @flow

import reducer, {defaultState} from './collection'
import { RECEIVE_COLLECTION } from '../constants/ActionTypes'
import Song from '../entities/Song'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(
        {"rows": {}, "totalRows": 0, "visibleSongs": []}
      )
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


