import Album from './Album'

describe('entities/Album', () => {
  it('should have id property', () => {
    const album = new Album({name: 'test'})
    expect(album).toBeDefined()
    expect(album.id).toBe('test')
  })
})
