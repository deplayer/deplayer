import { describe, it, expect } from 'vitest'
import { getSongs } from './index'

describe('Queue Saga', () => {
  describe('getSongs selector', () => {
    const mockState = {
      collection: {
        searchResults: ['search1', 'search2'],
        filteredSongs: ['filtered1', 'filtered2'],
        songsByAlbum: {
          'album1': ['song1', 'song2'],
        },
        songsByArtist: {
          'artist1': ['song3', 'song4'],
        },
        songsByGenre: {
          'genre1': ['song5', 'song6'],
        }
      }
    }

    it('should return search results for search-results path', () => {
      const result = getSongs(mockState, { path: 'search-results' })
      expect(result).toEqual(['search1', 'search2'])
    })

    it('should return songs by album for album route', () => {
      const result = getSongs(mockState, { path: 'albums/album1' })
      expect(result).toEqual(['song1', 'song2'])
    })

    it('should return songs by artist for artist route', () => {
      const result = getSongs(mockState, { path: 'artists/artist1' })
      expect(result).toEqual(['song3', 'song4'])
    })

    it('should return songs by genre for genre route', () => {
      const result = getSongs(mockState, { path: 'genres/genre1' })
      expect(result).toEqual(['song5', 'song6'])
    })

    it('should return filtered songs for unknown route', () => {
      const result = getSongs(mockState, { path: 'unknown/path' })
      expect(result).toEqual(['filtered1', 'filtered2'])
    })

    it('should return empty array for non-existent album', () => {
      const result = getSongs(mockState, { path: 'albums/non-existent' })
      expect(result).toEqual([])
    })

    it('should return empty array when state is null', () => {
      const result = getSongs(null, { path: 'any/path' })
      expect(result).toEqual([])
    })
  })
}) 