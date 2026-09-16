import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { MediaRow } from '../types/media'

vi.mock('axios')
vi.mock('@happy-js/happy-opfs', () => ({ readFile: vi.fn() }))
vi.mock('idb-keyval', () => ({ get: vi.fn() }))
vi.mock('./FileSystemService', () => ({ verifyPermission: vi.fn(async () => true) }))

import axios from 'axios'
import { MediaFileService } from './MediaFileService'

const remoteMedia = (uri: string): MediaRow =>
  ({ id: 'm1', stream: { subsonic: { service: 'subsonic', uris: [{ uri }] } } }) as unknown as MediaRow

describe('MediaFileService.getMediaFile (remote)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('strips f=json from legacy persisted URIs before downloading', async () => {
    const mockedGet = vi.mocked(axios.get)
    mockedGet.mockResolvedValue({ data: new Blob() })

    const result = await MediaFileService.getMediaFile(
      remoteMedia('https://srv/rest/stream.view?u=a&c=deplayer&v=1.11.0&f=json&id=song-1')
    )

    expect(mockedGet).toHaveBeenCalledWith(
      'https://srv/rest/stream.view?u=a&c=deplayer&v=1.11.0&id=song-1',
      { responseType: 'blob' }
    )
    expect(result).toBeInstanceOf(Blob)
  })

  it('downloads clean URIs unchanged', async () => {
    const mockedGet = vi.mocked(axios.get)
    mockedGet.mockResolvedValue({ data: new Blob() })

    await MediaFileService.getMediaFile(remoteMedia('https://srv/rest/stream.view?u=a&id=x'))

    expect(mockedGet).toHaveBeenCalledWith('https://srv/rest/stream.view?u=a&id=x', {
      responseType: 'blob',
    })
  })
})
