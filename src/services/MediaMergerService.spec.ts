import MediaMergerService from './MediaMergerService'
import Song from '../entities/Song'

describe('MediaMergerService', () => {
  it('should merge two media objects with its streams', () => {
    const song1 = new Song({
      stream: [{service: 'itunes', urls: []}]
    })
    const song2 = new Song({
      stream: [{service: 'itunes', urls: []}]
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
    expect(merged.stream.length).toBe(1)
  })

  it('should combine two different streams', () => {
    const song1 = new Song({
      stream: [{service: 'itunes', urls: []}]
    })
    const song2 = new Song({
      stream: [
        {service: 'itunes', urls: []},
        {service: 'subsonic', urls: []}
      ]
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
    expect(merged.stream.length).toBe(2)
  })

  it('should keep cover object', () => {
    const song1 = new Song({
      thumbnailUrl: 'test.png'
    })
    const song2 = new Song({
      thumbnailUrl: 'test.png',
      fullUrl: 'test-full.png'
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged.cover).toBeDefined()
  })
})
