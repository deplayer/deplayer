import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubsonicApiProvider from './SubsonicApiProvider'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

const albumList = (albums: unknown[]) => ({
  data: { 'subsonic-response': { albumList2: { album: albums } } },
})
const albumDetail = (album: { id: string; year?: number }, songs: unknown[]) => ({
  data: { 'subsonic-response': { album: { ...album, song: songs } } },
})

describe('SubsonicApiProvider.streamAlbumsSince', () => {
  let provider: SubsonicApiProvider
  beforeEach(() => {
    vi.resetAllMocks()
    provider = new SubsonicApiProvider(
      { baseUrl: 'http://localhost', user: 'u', password: 'p' },
      'subsonic-1',
    )
  })

  it('yields page-sized chunks and stops at the `since` boundary', async () => {
    mockedAxios.get
      .mockResolvedValueOnce(albumList([
        { id: 'a1', created: '2026-03-18T00:00:00Z' },
        { id: 'a2', created: '2026-03-17T00:00:00Z' },
        { id: 'a3', created: '2026-03-10T00:00:00Z' },
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a1', year: 2026 }, [
        { id: 's1', title: 'S1', artist: 'A', album: 'Al1', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a2', year: 2026 }, [
        { id: 's2', title: 'S2', artist: 'A', album: 'Al2', duration: 1, track: 1 },
      ]))

    const collected: string[] = []
    for await (const page of provider.streamAlbumsSince!('2026-03-15T00:00:00Z')) {
      for (const m of page.media) collected.push(m.media.title!)
    }
    expect(collected.sort()).toEqual(['S1', 'S2'])
  })

  it('first sync (since=null) walks until provider returns empty', async () => {
    mockedAxios.get
      .mockResolvedValueOnce(albumList([{ id: 'a1', created: '2026-03-18T00:00:00Z' }]))
      .mockResolvedValueOnce(albumDetail({ id: 'a1' }, [
        { id: 's1', title: 'S1', artist: 'A', album: 'Al1', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumList([]))

    const collected: string[] = []
    for await (const page of provider.streamAlbumsSince!(null, { pageSize: 50 })) {
      for (const m of page.media) collected.push(m.media.title!)
    }
    expect(collected).toEqual(['S1'])
  })

  it('does not stop early on first sync when an album lacks `created`', async () => {
    mockedAxios.get
      .mockResolvedValueOnce(albumList([
        { id: 'a1', created: '2026-03-18T00:00:00Z' },
        { id: 'a2' /* no created */ },
        { id: 'a3', created: '2026-03-17T00:00:00Z' },
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a1' }, [
        { id: 's1', title: 'S1', artist: 'A', album: 'Al1', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a2' }, [
        { id: 's2', title: 'S2', artist: 'A', album: 'Al2', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumDetail({ id: 'a3' }, [
        { id: 's3', title: 'S3', artist: 'A', album: 'Al3', duration: 1, track: 1 },
      ]))
      .mockResolvedValueOnce(albumList([]))

    const collected: string[] = []
    for await (const page of provider.streamAlbumsSince!(null, { pageSize: 50 })) {
      for (const m of page.media) collected.push(m.media.title!)
    }
    expect(collected.sort()).toEqual(['S1', 'S2', 'S3'])
  })
})
