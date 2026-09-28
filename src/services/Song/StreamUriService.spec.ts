import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type { MediaRow } from '../../types/media'
import { getStreamUri, releaseStreamSource } from './StreamUriService'

vi.mock('@happy-js/happy-opfs', () => ({ readFile: vi.fn() }))
vi.mock('idb-keyval', () => ({ get: vi.fn() }))
vi.mock('../FileSystemService', () => ({ verifyPermission: vi.fn(async () => true) }))

import { readFile } from '@happy-js/happy-opfs'
import { get } from 'idb-keyval'

const createObjectURL = vi.fn(() => 'blob:mock')
const revokeObjectURL = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(URL, 'createObjectURL', { value: createObjectURL, configurable: true, writable: true })
  Object.defineProperty(URL, 'revokeObjectURL', { value: revokeObjectURL, configurable: true, writable: true })
})

const song = (service: string, uri: string): MediaRow =>
  ({ stream: { p1: { service, uris: [{ uri }] } } }) as unknown as MediaRow

describe('getStreamUri', () => {
  it('reads opfs files as a zero-copy File (no ArrayBuffer/Blob copy)', async () => {
    const file = new File([new Uint8Array(8)], 'track.mp3', { type: 'audio/mpeg' })
    ;(readFile as Mock).mockResolvedValue({ unwrap: () => file })

    const source = await getStreamUri(song('opfs', 'opfs://track.mp3'), 0)

    expect(source.kind).toBe('blob')
    expect(source.url).toBe('blob:mock')
    expect(readFile).toHaveBeenCalledWith('/track.mp3', { encoding: 'blob' })
    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(createObjectURL).toHaveBeenCalledWith(file)
  })

  it('returns a blob-kind source for filesystem File handlers', async () => {
    (get as Mock).mockResolvedValue(new File(['data'], 'track.mp3'))

    const source = await getStreamUri(song('filesystem', 'idb-key-1'), 0)

    expect(source.kind).toBe('blob')
    expect(source.url).toBe('blob:mock')
  })

  it('returns remote kind for remote providers without creating object URLs', async () => {
    const source = await getStreamUri(song('subsonic', 'https://srv/stream'), 0)

    expect(source).toEqual({ url: 'https://srv/stream', kind: 'remote' })
    expect(createObjectURL).not.toHaveBeenCalled()
  })

  it('strips f=json from legacy persisted subsonic stream URIs', async () => {
    const source = await getStreamUri(
      song('subsonic', 'https://srv/rest/stream.view?u=a&p=b&c=deplayer&v=1.11.0&f=json&id=song-1'),
      0
    )

    expect(source.url).toBe('https://srv/rest/stream.view?u=a&p=b&c=deplayer&v=1.11.0&id=song-1')
    expect(source.kind).toBe('remote')
  })

  it('strips f=json when it is the trailing query param', async () => {
    const source = await getStreamUri(song('subsonic', 'https://srv/stream?v=1.11.0&f=json'), 0)

    expect(source.url).toBe('https://srv/stream?v=1.11.0')
  })

  it('leaves clean URIs untouched', async () => {
    const source = await getStreamUri(song('subsonic', 'https://srv/stream?v=1.11.0&id=x'), 0)

    expect(source.url).toBe('https://srv/stream?v=1.11.0&id=x')
  })
})

describe('releaseStreamSource', () => {
  it('revokes blob sources', () => {
    releaseStreamSource({ url: 'blob:x', kind: 'blob' })
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
  })

  it('is a no-op for remote sources and null', () => {
    releaseStreamSource({ url: 'https://srv/stream', kind: 'remote' })
    releaseStreamSource(null)
    releaseStreamSource(undefined)
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })
})
