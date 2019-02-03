import reducer from './connection'

import { defaultState } from './connection'

describe('connection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(defaultState)
  })
})
