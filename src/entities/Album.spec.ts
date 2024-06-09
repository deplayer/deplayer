import { describe, it, expect } from 'vitest'

import Album from './Album'
import Artist from './Artist'

describe('entities/Album', () => {
  it('should have id property', () => {
    const artist = new Artist({ name: 'The Clash' })
    const album = new Album({ name: 'test', artist })
    expect(album).toBeDefined()
    expect(album.id).toBe('the-clash-test')
  })
})
