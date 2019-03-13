// @flow

import Artist from './Artist'

describe('entities/Artist', () => {
  it('should have id property', () => {
    const artist = new Artist()
    expect(artist).toBeDefined()
  })
})
