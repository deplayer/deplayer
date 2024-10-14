import { describe, it, expect } from 'vitest'

import Artist from './Artist'

describe('entities/Artist', () => {
  it('should have id property', () => {
    const artist = new Artist({ name: 'foo' })
    expect(artist).toBeDefined()
  })
})
