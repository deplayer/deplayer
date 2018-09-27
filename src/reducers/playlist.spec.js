// @flow

import reducer from './playlist'

describe('collection reducer', () => {
  it('should return the initial state', () => {
    expect(reducer(undefined, {}))
      .toEqual({
        currentPlaying: {},
        tracks: {}
      })
  })
})
