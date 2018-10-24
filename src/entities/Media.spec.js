// @flow

import Media from './Media'

describe('entities/Media', () => {
  it('should have id property', () => {
    const media = new Media()
    expect(media).toBeDefined()
  })
})
