import { describe, it, expect } from 'vitest'
import { getSongs, getSongObjects } from './index'

describe('Queue Saga', () => {
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
      },
      rows: {
        'song1': { id: 'song1', title: 'Song 1' },
        'song2': { id: 'song2', title: 'Song 2' },
        'song3': { id: 'song3', title: 'Song 3' },
        'song4': { id: 'song4', title: 'Song 4' },
        'song5': { id: 'song5', title: 'Song 5' },
        'song6': { id: 'song6', title: 'Song 6' },
        'filtered1': { id: 'filtered1', title: 'Filtered 1' },
        'filtered2': { id: 'filtered2', title: 'Filtered 2' },
        'search1': { id: 'search1', title: 'Search 1' },
        'search2': { id: 'search2', title: 'Search 2' },
      }
    }
  }

  describe('getSongs selector', () => {
    it('should return search results for search-results path', () => {
      const result = getSongs(mockState, { path: 'search-results' })
      expect(result).toEqual(['search1', 'search2'])
    })

    it('should return filtered songs for collection path', () => {
      const result = getSongs(mockState, { path: 'collection' })
      expect(result).toEqual(['filtered1', 'filtered2'])
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

  describe('getSongObjects selector', () => {
    it('should return song objects for given ids', () => {
      const result = getSongObjects(mockState, ['song1', 'song2'])
      expect(result).toEqual([
        { id: 'song1', title: 'Song 1' },
        { id: 'song2', title: 'Song 2' }
      ])
    })

    it('should filter out non-existent song ids', () => {
      const result = getSongObjects(mockState, ['song1', 'nonexistent', 'song2'])
      expect(result).toEqual([
        { id: 'song1', title: 'Song 1' },
        { id: 'song2', title: 'Song 2' }
      ])
    })

    it('should return empty array for empty input', () => {
      const result = getSongObjects(mockState, [])
      expect(result).toEqual([])
    })
  })
}) 