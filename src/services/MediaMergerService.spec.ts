import MediaMergerService from './MediaMergerService'
import Media from '../entities/Media'

describe('MediaMergerService', () => {
  it('should merge two media objects with its streams', () => {
    const song1 = new Media({
      stream: [{ service: 'itunes', urls: [] }]
    })
    const song2 = new Media({
      stream: [{ service: 'itunes', urls: [] }]
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
    expect(merged.stream.length).toBe(1)
  })

  it('should combine two different streams', () => {
    const song1 = new Media({
      stream: [{ service: 'itunes', urls: [] }]
    })
    const song2 = new Media({
      stream: [
        { service: 'itunes', urls: [] },
        { service: 'subsonic', urls: [] }
      ]
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
    expect(merged.stream.length).toBe(2)
    expect(merged.stream[0].service).toBe('itunes')
  })

  it('should combine cover object', () => {
    const song1 = new Media({
      cover: { thumbnailUrl: 'test.png' }
    })
    const song2 = new Media({
      cover: {
        thumbnailUrl: 'test.png',
        fullUrl: 'test-full.png'
      }
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged.cover).toBeDefined()
    expect(merged.cover.thumbnailUrl).toBe('test.png')
    expect(merged.cover.fullUrl).toBe('test-full.png')
  })
})
