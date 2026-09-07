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
  it('returns a blob-kind source for opfs files', async () => {
    (readFile as Mock).mockResolvedValue({ unwrap: () => new ArrayBuffer(8) })

    const source = await getStreamUri(song('opfs', 'opfs://track.mp3'), 0)

    expect(source.kind).toBe('blob')
    expect(source.url).toBe('blob:mock')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
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
