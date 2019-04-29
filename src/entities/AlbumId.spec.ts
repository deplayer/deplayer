import ArtistId from './ArtistId'

describe('entities/ArtistId', () => {
  it('should calculate value property', () => {
    const artistId = new ArtistId({artistName: ''})

    expect(artistId.value).toBeDefined()
  })

  it('should create the id from artist name', () => {
    const artistId = new ArtistId({artistName: 'lorem'})

    expect(artistId.value).toBe('lorem')
  })

  it('should avoid spaces', () => {
    const artistId = new ArtistId({artistName: 'lorem'})

    expect(artistId.value).toBe('lorem')
  })
})
