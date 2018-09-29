// @flow

import reducer from './reducer'
import { SEARCH_REJECTED } from '../../constants/ActionTypes'

describe('search reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(
        {
          error: ''
        }
      )
  })

  it('should handle SEARCH_REJECTED', () => {
    expect(reducer({error: ''}, {type: SEARCH_REJECTED, message: 'Testing error'}))
  })
})


