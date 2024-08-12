import { describe, it, expect } from 'vitest'
import MediaMergerService from './MediaMergerService'
import Media from '../entities/Media'
import { mediaParams } from '../entities/Media.spec'

describe('MediaMergerService', () => {
  it('should merge two media objects with its streams', () => {
    const song1 = new Media({
      ...mediaParams,
      stream: [{ service: 'itunes', uris: [] }]
    })
    const song2 = new Media({
      ...mediaParams,
      stream: [{ service: 'itunes', uris: [] }]
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
    expect(merged.stream.length).toBe(1)
  })

  it('should combine two different streams', () => {
    const song1 = new Media({
      ...mediaParams,
      stream: [{ service: 'itunes', uris: [] }]
    })
    const song2 = new Media({
      ...mediaParams,
      stream: [
        { service: 'itunes', uris: [] },
        { service: 'subsonic', uris: [] }
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
      ...mediaParams,
      cover: { thumbnailUrl: 'test.png', fullUrl: 'test-full.png' }
    })
    const song2 = new Media({
      ...mediaParams,
      cover: {
        thumbnailUrl: 'test.png',
        fullUrl: 'test-full.png'
      }
    })
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged.cover).toBeDefined()
    expect(merged.cover?.thumbnailUrl).toBe('test.png')
    expect(merged.cover?.fullUrl).toBe('test-full.png')
  })
})
