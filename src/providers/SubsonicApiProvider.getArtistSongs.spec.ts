import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import SubsonicApiProvider from './SubsonicApiProvider'

vi.mock('axios')
const mockedGet = axios.get as ReturnType<typeof vi.fn>

describe('SubsonicApiProvider.getArtistSongs', () => {
  let provider: SubsonicApiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider({
      baseUrl: 'http://localhost:4533',
      user: 'admin',
      password: 'admin'
    }, 'navidrome')
  })

  it('should return songs for an artist', async () => {
    // Mock search3 to find artist
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          searchResult3: {
            artist: [{ id: 'ar-123', name: 'Test Artist' }]
          }
        }
      }
    })

    // Mock getArtist to get albums
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          artist: {
            id: 'ar-123',
            name: 'Test Artist',
            album: [
              { id: 'al-1', name: 'Album 1', year: 2020 },
              { id: 'al-2', name: 'Album 2', year: 2021 }
            ]
          }
        }
      }
    })

    // Mock getAlbum for each album
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          album: {
            id: 'al-1',
            name: 'Album 1',
            year: 2020,
            song: [
              { id: 's1', title: 'Song 1', artist: 'Test Artist', album: 'Album 1', duration: 180, track: 1, path: '/music/song1.mp3', coverArt: 'cov1', genres: [] }
            ]
          }
        }
      }
    })

    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          album: {
            id: 'al-2',
            name: 'Album 2',
            year: 2021,
            song: [
              { id: 's2', title: 'Song 2', artist: 'Test Artist', album: 'Album 2', duration: 200, track: 1, path: '/music/song2.mp3', coverArt: 'cov2', genres: [] }
            ]
          }
        }
      }
    })

    const songs = await provider.getArtistSongs('Test Artist')

    expect(songs).toHaveLength(2)
    expect(songs[0].title).toBe('Song 1')
    expect(songs[1].title).toBe('Song 2')
  })

  it('should return empty array when artist not found', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          searchResult3: {
            artist: []
          }
        }
      }
    })

    const songs = await provider.getArtistSongs('Unknown Artist')

    expect(songs).toEqual([])
  })

  it('should match artist name case-insensitively', async () => {
    // Mock search3 to find artist with different case
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          searchResult3: {
            artist: [{ id: 'ar-123', name: 'TEST ARTIST' }]
          }
        }
      }
    })

    // Mock getArtist to get albums
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          artist: {
            id: 'ar-123',
            name: 'TEST ARTIST',
            album: []
          }
        }
      }
    })

    const songs = await provider.getArtistSongs('test artist')

    expect(songs).toEqual([])
    // Verify search was called
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('should handle artist with no albums', async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          searchResult3: {
            artist: [{ id: 'ar-123', name: 'Test Artist' }]
          }
        }
      }
    })

    mockedGet.mockResolvedValueOnce({
      data: {
        'subsonic-response': {
          artist: {
            id: 'ar-123',
            name: 'Test Artist',
            album: []
          }
        }
      }
    })

    const songs = await provider.getArtistSongs('Test Artist')

    expect(songs).toEqual([])
  })
})
