import { describe, it, expect } from 'vitest'
import { getLocalRecommendations } from '../../../services/Recommendations/RecommendationService'

describe('getLocalRecommendations', () => {
  const library = [
    { id: '1', artistId: 'a1', artistName: 'A1', genres: ['rock', 'indie'], playCount: 10 },
    { id: '2', artistId: 'a2', artistName: 'A2', genres: ['rock'], playCount: 5 },
    { id: '3', artistId: 'a3', artistName: 'A3', genres: ['jazz'], playCount: 20 },
    { id: '4', artistId: 'a1', artistName: 'A1', genres: ['rock'], playCount: 3 },
  ]

  it('excludes source artist and matches genres', () => {
    const result = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['rock'],
      library,
      limit: 10,
    })
    expect(result.map(r => r.id)).toEqual(['2'])
    expect(result.find(r => r.artistId === 'a1')).toBeUndefined()
  })

  it('returns empty when no genres match', () => {
    const result = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: ['electronic'],
      library,
      limit: 10,
    })
    expect(result).toEqual([])
  })

  it('returns empty when no genres provided', () => {
    const result = getLocalRecommendations({
      sourceArtistId: 'a1',
      sourceGenres: [],
      library,
      limit: 10,
    })
    expect(result).toEqual([])
  })
})
