// @flow

import reducer, {defaultState} from './collection'
import { ADD_TO_COLLECTION } from '../constants/ActionTypes'
import Song from '../entities/Song'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(
        {"rows": {}, "totalRows": 0, "visibleSongs": []}
      )
  })

  it('should handle ADD_TO_COLLECTION', () => {
    const fixtureSong = new Song()
    const rows = {}
    rows[fixtureSong.id] = fixtureSong
    const expected = {...defaultState, totalRows: 1, rows}
    expect(reducer(defaultState, {type: ADD_TO_COLLECTION, data: [fixtureSong]}))
      .toEqual(expected)
  })
})


