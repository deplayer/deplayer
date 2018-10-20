// @flow

import reducer from './settings'

describe('settings reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual(
        {
          error: '',
          saving: false
        }
      )
  })
})
