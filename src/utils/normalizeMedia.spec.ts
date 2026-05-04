import { describe, it, expect } from 'vitest'
import { normalizeMedia, RawMediaInput } from './normalizeMedia'

describe('normalizeMedia', () => {
  describe('duration conversion', () => {
    it('converts seconds to ms', () => {
      const result = normalizeMedia({ duration: { value: 5, unit: 'seconds' } })
      expect(result.media.duration).toBe(5000)
    })

    it('converts ticks to ms', () => {
      const result = normalizeMedia({ duration: { value: 100000, unit: 'ticks' } })
      expect(result.media.duration).toBe(10)
    })

    it('passes through ms unit', () => {
      const result = normalizeMedia({ duration: { value: 3000, unit: 'ms' } })
      expect(result.media.duration).toBe(3000)
    })

    it('treats bare number as ms', () => {
      const result = normalizeMedia({ duration: 4500 })
      expect(result.media.duration).toBe(4500)
    })

    it('defaults to 0 when missing', () => {
      const result = normalizeMedia({})
      expect(result.media.duration).toBe(0)
    })
  })

  describe('defaults', () => {
    it('uses "Unknown Artist" when artistName is missing', () => {
      const result = normalizeMedia({})
      expect(result.media.artistName).toBe('Unknown Artist')
      expect(result.artist.name).toBe('Unknown Artist')
    })

    it('uses "Unknown Album" when albumName is missing', () => {
      const result = normalizeMedia({})
      expect(result.media.albumName).toBe('Unknown Album')
      expect(result.album.name).toBe('Unknown Album')
    })

    it('uses "Untitled" when title is missing', () => {
      const result = normalizeMedia({})
      expect(result.media.title).toBe('Untitled')
    })
  })

  describe('genres', () => {
    it('filters empty strings from array', () => {
      const result = normalizeMedia({ genres: ['rock', '', 'pop', ''] })
      expect(result.media.genres).toEqual(['rock', 'pop'])
    })

    it('handles string input', () => {
      const result = normalizeMedia({ genres: 'rock' })
      expect(result.media.genres).toEqual(['rock'])
    })

    it('handles missing genres', () => {
      const result = normalizeMedia({})
      expect(result.media.genres).toEqual([])
    })
  })

  describe('IDs', () => {
    it('generates consistent IDs for same input', () => {
      const input: RawMediaInput = { title: 'Song', artistName: 'Artist', albumName: 'Album' }
      const r1 = normalizeMedia(input)
      const r2 = normalizeMedia(input)
      expect(r1.media.id).toBe(r2.media.id)
      expect(r1.artist.id).toBe(r2.artist.id)
      expect(r1.album.id).toBe(r2.album.id)
    })

    it('uses forcedId when provided', () => {
      const result = normalizeMedia({ forcedId: 'my-custom-id' })
      expect(result.media.id).toBe('my-custom-id')
    })
  })

  describe('denormalized fields', () => {
    it('computes genresFlat correctly', () => {
      const result = normalizeMedia({ genres: ['rock', 'pop'] })
      expect(result.media.genresFlat).toBe('rock,pop')
    })

    it('computes providersFlat correctly', () => {
      const result = normalizeMedia({
        stream: {
          spotify: { service: 'spotify', uris: [{ uri: 'spotify:track:123' }] },
          youtube: { service: 'youtube', uris: [{ uri: 'https://youtube.com/watch?v=abc' }] }
        }
      })
      expect(result.media.providersFlat).toBe('spotify,youtube')
    })
  })

  describe('album', () => {
    it('gets thumbnailUrl from cover', () => {
      const result = normalizeMedia({
        cover: { thumbnailUrl: 'https://example.com/thumb.jpg', fullUrl: 'https://example.com/full.jpg' }
      })
      expect(result.album.thumbnailUrl).toBe('https://example.com/thumb.jpg')
    })

    it('has null thumbnailUrl when no cover', () => {
      const result = normalizeMedia({})
      expect(result.album.thumbnailUrl).toBeNull()
    })

    it('includes year', () => {
      const result = normalizeMedia({ year: 2023 })
      expect(result.album.year).toBe(2023)
    })
  })

  describe('returned structure', () => {
    it('returns artist and album as separate objects with correct IDs', () => {
      const result = normalizeMedia({ artistName: 'The Beatles', albumName: 'Abbey Road' })
      expect(result.artist.id).toBe(result.media.artistId)
      expect(result.album.id).toBe(result.media.albumId)
      expect(result.album.artistId).toBe(result.artist.id)
    })
  })
})
