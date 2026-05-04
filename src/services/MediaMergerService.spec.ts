import { describe, it, expect } from 'vitest'
import MediaMergerService from './MediaMergerService'
import type { MediaRow } from '../types/media'

const baseMedia: MediaRow = {
  id: 'test-id',
  title: 'Test Song',
  artistId: 'test-artist',
  albumId: 'test-album',
  artistName: 'Test Artist',
  albumName: 'Test Album',
  type: 'audio',
  duration: 180,
  playCount: 0,
  track: null,
  discNumber: null,
  stream: {},
  cover: null,
  genres: [],
  externalId: null,
  shareUrl: null,
  filePath: null,
  genresFlat: '',
  providersFlat: '',
}

describe('MediaMergerService', () => {
  it('should merge two media objects with its streams', () => {
    const song1: MediaRow = {
      ...baseMedia,
      stream: { itunes: { service: 'itunes', uris: [] } }
    }
    const song2: MediaRow = {
      ...baseMedia,
      stream: { itunes: { service: 'itunes', uris: [] } }
    }
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
  })

  it('should combine two different streams', () => {
    const song1: MediaRow = {
      ...baseMedia,
      stream: { itunes: { service: 'itunes', uris: [] } }
    }
    const song2: MediaRow = {
      ...baseMedia,
      stream: {
        itunes: { service: 'itunes', uris: [] },
        subsonic: { service: 'subsonic', uris: [] }
      }
    }
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged).toBeDefined()
    // deepmerge with custom stream merger returns an array of unique services
    const streamValues = Object.values(merged.stream)
    expect(streamValues.length).toBe(2)
  })

  it('should combine cover object', () => {
    const song1: MediaRow = {
      ...baseMedia,
      cover: { thumbnailUrl: 'test.png', fullUrl: 'test-full.png' }
    }
    const song2: MediaRow = {
      ...baseMedia,
      cover: {
        thumbnailUrl: 'test.png',
        fullUrl: 'test-full.png'
      }
    }
    const mediaMergerService = new MediaMergerService(song1, song2)
    const merged = mediaMergerService.getMerged()

    expect(merged.cover).toBeDefined()
    expect(merged.cover?.thumbnailUrl).toBe('test.png')
    expect(merged.cover?.fullUrl).toBe('test-full.png')
  })
})
