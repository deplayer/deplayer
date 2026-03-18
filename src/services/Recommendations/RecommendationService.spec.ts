import { describe, it, expect } from 'vitest'
import { getLocalRecommendations } from './RecommendationService'

describe('RecommendationService', () => {
  const mockLibrary = [
    { id: '1', artistId: 'a1', artistName: 'Radiohead', genres: ['rock', 'alternative'], playCount: 50 },
    { id: '2', artistId: 'a1', artistName: 'Radiohead', genres: ['rock', 'electronic'], playCount: 30 },
    { id: '3', artistId: 'a2', artistName: 'Muse', genres: ['rock', 'alternative'], playCount: 40 },
    { id: '4', artistId: 'a2', artistName: 'Muse', genres: ['rock'], playCount: 20 },
    { id: '5', artistId: 'a3', artistName: 'Björk', genres: ['electronic', 'experimental'], playCount: 10 },
    { id: '6', artistId: 'a4', artistName: 'Portishead', genres: ['electronic', 'trip-hop'], playCount: 15 },
  ]

  it('should return songs sharing genres with source, excluding source artist', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock', 'alternative'],
      library: mockLibrary,
      limit: 10,
    })
    expect(results.every(r => r.artistId !== 'a1')).toBe(true)
    expect(results.some(r => r.artistId === 'a2')).toBe(true)
  })

  it('should limit results per artist to max 2', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock'],
      library: mockLibrary,
      limit: 20,
    })
    const museCount = results.filter(r => r.artistId === 'a2').length
    expect(museCount).toBeLessThanOrEqual(2)
  })

  it('should rank by genre overlap then playCount', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock', 'alternative'],
      library: mockLibrary,
      limit: 10,
    })
    // Muse song id:3 shares 2 genres (rock + alternative) with highest playCount
    expect(results[0].artistId).toBe('a2')
  })

  it('should return empty array when no matching genres', () => {
    const results = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['jazz'],
      library: mockLibrary,
      limit: 10,
    })
    expect(results).toEqual([])
  })
})
