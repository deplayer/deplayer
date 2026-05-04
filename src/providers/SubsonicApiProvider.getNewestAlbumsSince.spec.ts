import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubsonicApiProvider from './SubsonicApiProvider'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

const makeAlbumListResponse = (albums: any[]) => ({
  data: {
    'subsonic-response': {
      albumList2: { album: albums },
    },
  },
})

const makeAlbumDetailResponse = (album: any, songs: any[]) => ({
  data: {
    'subsonic-response': {
      album: { ...album, song: songs },
    },
  },
})

describe('SubsonicApiProvider.getNewestAlbumsSince', () => {
  let provider: SubsonicApiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider(
      { baseUrl: 'http://localhost', user: 'test', password: 'test' },
      'subsonic-1'
    )
  })

  it('should fetch only albums newer than sinceDate', async () => {
    mockedAxios.get
      .mockResolvedValueOnce(
        makeAlbumListResponse([
          { id: 'a1', name: 'New Album 1', created: '2026-03-18T00:00:00Z', songCount: 1 },
          { id: 'a2', name: 'New Album 2', created: '2026-03-17T00:00:00Z', songCount: 1 },
          { id: 'a3', name: 'Old Album', created: '2026-03-10T00:00:00Z', songCount: 1 },
        ])
      )
      .mockResolvedValueOnce(
        makeAlbumDetailResponse(
          { id: 'a1', year: 2026 },
          [{ id: 's1', title: 'Song 1', artist: 'Artist', album: 'New Album 1', duration: 200, track: 1 }]
        )
      )
      .mockResolvedValueOnce(
        makeAlbumDetailResponse(
          { id: 'a2', year: 2026 },
          [{ id: 's2', title: 'Song 2', artist: 'Artist', album: 'New Album 2', duration: 180, track: 1 }]
        )
      )

    const result = await provider.getNewestAlbumsSince('2026-03-15T00:00:00Z')

    expect(result).toHaveLength(2)
    expect(result[0].media.title).toBe('Song 1')
    expect(result[1].media.title).toBe('Song 2')
    expect(mockedAxios.get).toHaveBeenCalledTimes(3)
  })

  it('should return empty array when no new albums', async () => {
    mockedAxios.get.mockResolvedValueOnce(
      makeAlbumListResponse([
        { id: 'a1', name: 'Old Album', created: '2026-03-10T00:00:00Z', songCount: 1 },
      ])
    )

    const result = await provider.getNewestAlbumsSince('2026-03-15T00:00:00Z')
    expect(result).toHaveLength(0)
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
  })

  it('should handle empty album list', async () => {
    mockedAxios.get.mockResolvedValueOnce(
      makeAlbumListResponse([])
    )

    const result = await provider.getNewestAlbumsSince('2026-03-15T00:00:00Z')
    expect(result).toHaveLength(0)
  })
})
