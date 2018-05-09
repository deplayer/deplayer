import reducer from './table'
import * as types from '../constants/ActionTypes'

describe('table reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual({
        data: [],
        total: 0,
        page: 0,
        pages: 0
      })
  })

  it('should handle FILL_VISIBLE_SONGS_FULLFILLED', () => {
    const action = {
      type: types.FILL_VISIBLE_SONGS_FULLFILLED,
      data: {
        docs: [{label: 'test'}]
      }
    }


    expect(reducer(undefined, action))
      .toEqual({
        data: [{label: 'test'}],
        total: 0,
        page: 0,
        pages: 0
      })
  })
})
