// @flow

import Media from './Media'

describe('entities/Media', () => {
  it('should have id property', () => {
    const media = new Media()
    expect(media).toBeDefined()
  })

  it('should return a schema representation', () => {
    expect(Media.toSchema()).toBeDefined()
  })
})
