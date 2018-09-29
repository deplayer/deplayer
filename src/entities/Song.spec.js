// @flow

import Song from './Song'

describe('entities/Song', () => {
  it('should have id property', () => {
    const song = new Song()
    expect(song.id).toBeDefined()
  })
})
