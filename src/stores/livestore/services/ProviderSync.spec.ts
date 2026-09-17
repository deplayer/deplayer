import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Mock } from 'vitest'
import type {
  AlbumPage,
  ScanStatus,
} from '../../../providers/IMusicProvider'
import type { NormalizedMedia } from '../../../utils/normalizeMedia'
import type { LiveStore } from '../accessor'
import {
  syncProvider,
  isStreamingProvider,
  type StreamingProvider,
} from './ProviderSync'
import { batchedMediaCommitter } from './BatchedMediaCommitter'
import { resumeFor, save } from './SyncResumeState'
import { useUIStore } from '../../uiStore'

vi.mock('./SyncResumeState', () => ({
  resumeFor: vi.fn(),
  save: vi.fn(),
}))

const fakeLiveStore = { id: 'test-store' } as unknown as LiveStore
const SCAN: ScanStatus = {
  scanning: false,
  count: 100,
  lastScan: '2026-07-17T00:00:00Z',
}

function makePage(
  media: NormalizedMedia[],
  hasMore: boolean,
  nextCursor: number | null,
): AlbumPage {
  return { media, hasMore, nextCursor }
}

/** Hand-rolled stream: `return` is a spy so cleanup calls are observable. */
type TestStream = {
  next: () => Promise<IteratorResult<AlbumPage, void>>
  throw: (e: unknown) => Promise<never>
  return: Mock
  [Symbol.asyncIterator](): TestStream
}

type FakedProvider = {
  providerKey: string
  search: Mock
  getScanStatus: Mock
  streamAlbumsSince: Mock
}

function makeStream(pages: AlbumPage[]): TestStream {
  let i = 0
  const stream: TestStream = {
    next: async () =>
      i < pages.length
        ? { done: false, value: pages[i++] }
        : { done: true, value: undefined },
    throw: (e: unknown) => Promise.reject(e),
    return: vi.fn(async () => ({ done: true, value: undefined })),
    [Symbol.asyncIterator]() {
      return this
    },
  }
  return stream
}

function makeProvider(pages: AlbumPage[]): FakedProvider {
  return {
    providerKey: 'test',
    search: vi.fn(),
    getScanStatus: vi.fn(async (): Promise<ScanStatus> => ({
      ...SCAN,
      scanning: false,
    })),
    streamAlbumsSince: vi.fn(() => makeStream(pages)),
  }
}

function lastStream(provider: FakedProvider): TestStream {
  return provider.streamAlbumsSince.mock.results[0].value
}

describe('ProviderSync', () => {
  let addSpy: Mock
  let flushSpy: Mock
  let setStoreSpy: Mock
  let refreshSpy: Mock
  let progressSpy: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    addSpy = vi.spyOn(batchedMediaCommitter, 'add').mockResolvedValue(
      undefined,
    ) as Mock
    flushSpy = vi.spyOn(batchedMediaCommitter, 'flush').mockResolvedValue(
      undefined,
    ) as Mock
    setStoreSpy = vi
      .spyOn(batchedMediaCommitter, 'setStore')
      .mockImplementation(() => {}) as Mock
    refreshSpy = vi
      .spyOn(batchedMediaCommitter, 'refresh')
      .mockResolvedValue(undefined) as Mock
    progressSpy = vi
      .spyOn(useUIStore.getState(), 'setSyncProgress') as Mock
    vi.mocked(resumeFor).mockResolvedValue({
      since: '2026-07-17T00:00:00Z',
      cursor: null,
    })
    vi.mocked(save).mockResolvedValue(undefined)
  })

  it('skips a scanning server without touching the committer or resume state', async () => {
    const provider = makeProvider([])
    provider.getScanStatus.mockResolvedValue({ ...SCAN, scanning: true })

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'skipped', reason: 'scanning' })
    expect(vi.mocked(resumeFor)).not.toHaveBeenCalled()
    expect(provider.streamAlbumsSince).not.toHaveBeenCalled()
    expect(addSpy).not.toHaveBeenCalled()
    expect(vi.mocked(save)).not.toHaveBeenCalled()
  })

  it('commits each page with skipRefresh and saves resume state per page', async () => {
    const media1 = [{ id: 't1' } as unknown as NormalizedMedia]
    const media2 = [{ id: 't2' } as unknown as NormalizedMedia]
    const provider = makeProvider([
      makePage(media1, true, 1),
      makePage(media2, false, 2),
    ])

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'synced', pages: 2 })
    expect(setStoreSpy).toHaveBeenCalledWith(fakeLiveStore)
    expect(provider.streamAlbumsSince).toHaveBeenCalledWith(
      '2026-07-17T00:00:00Z',
      { cursor: null, pageSize: 50 },
    )
    expect(addSpy).toHaveBeenCalledTimes(2)
    expect(addSpy).toHaveBeenNthCalledWith(1, media1, { skipRefresh: true })
    expect(addSpy).toHaveBeenNthCalledWith(2, media2, { skipRefresh: true })
    expect(flushSpy).toHaveBeenCalledTimes(2)
    expect(flushSpy).toHaveBeenNthCalledWith(1, { skipRefresh: true })
    expect(flushSpy).toHaveBeenNthCalledWith(2, { skipRefresh: true })
    expect(vi.mocked(save)).toHaveBeenNthCalledWith(1, fakeLiveStore, 'test', {
      scanStatus: SCAN,
      cursor: 1,
      complete: false,
      pageSize: 50,
    })
    expect(vi.mocked(save)).toHaveBeenNthCalledWith(2, fakeLiveStore, 'test', {
      scanStatus: SCAN,
      cursor: 2,
      complete: true,
      pageSize: 50,
    })
  })

  it('persists the same page size it streams with', async () => {
    const provider = makeProvider([
      makePage([{ id: 't1' } as unknown as NormalizedMedia], false, 1),
    ])

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'synced', pages: 1 })
    const streamedPageSize = provider.streamAlbumsSince.mock.calls[0][1]?.pageSize
    expect(streamedPageSize).toBe(50)
    for (const call of vi.mocked(save).mock.calls) {
      expect(call[2].pageSize).toBe(streamedPageSize)
    }
  })

  it('streams past the former page cap to completion, saving per page', async () => {
    const pages = Array.from({ length: 11 }, (_, i) =>
      makePage([{ id: `t${i}` } as unknown as NormalizedMedia], i < 10, i + 1),
    )
    const provider = makeProvider(pages)

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'synced', pages: 11 })
    expect(vi.mocked(save)).toHaveBeenCalledTimes(11)
    expect(vi.mocked(save)).toHaveBeenLastCalledWith(fakeLiveStore, 'test', {
      scanStatus: SCAN,
      cursor: 11,
      complete: true,
      pageSize: 50,
    })
    expect(lastStream(provider).return).not.toHaveBeenCalled()
  })

  it('refreshes and publishes progress every 10 pages, then clears on completion', async () => {
    const pages = Array.from({ length: 11 }, (_, i) =>
      makePage([{ id: `t${i}` } as unknown as NormalizedMedia], i < 10, i + 1),
    )
    const provider = makeProvider(pages)

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'synced', pages: 11 })
    // One progress refresh at the 10-page boundary (11 pages total, not a
    // multiple of 10). Determinate: the fake scan exposes a count of 100.
    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).toHaveBeenCalledWith('SyncProvider.progress')
    // Progress published at start (added 0) and at the 10-page tick (10 items
    // of 1 in the fake), then cleared in finally.
    expect(progressSpy).toHaveBeenNthCalledWith(1, {
      active: true,
      added: 0,
      total: 100,
    })
    expect(progressSpy).toHaveBeenNthCalledWith(2, {
      active: true,
      added: 10,
      total: 100,
    })
    expect(progressSpy).toHaveBeenLastCalledWith({
      active: false,
      added: 0,
      total: 0,
    })
    expect(useUIStore.getState().syncProgress).toEqual({
      active: false,
      added: 0,
      total: 0,
    })
  })

  it('publishes an indeterminate progress when the scan exposes no count', async () => {
    const provider = makeProvider([
      makePage([{ id: 't1' } as unknown as NormalizedMedia], false, 1),
    ])
    provider.getScanStatus.mockResolvedValue({ ...SCAN, count: 0 })

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'synced', pages: 1 })
    expect(progressSpy).toHaveBeenNthCalledWith(1, {
      active: true,
      added: 0,
      total: 0,
    })
    expect(progressSpy).toHaveBeenLastCalledWith({
      active: false,
      added: 0,
      total: 0,
    })
  })

  it('clears progress when a flush fails mid-stream', async () => {
    flushSpy.mockRejectedValue(new Error('flush boom'))
    const provider = makeProvider([
      makePage([{ id: 't1' } as unknown as NormalizedMedia], true, 1),
      makePage([{ id: 't2' } as unknown as NormalizedMedia], false, 2),
    ])

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'failed', pages: 0 })
    expect(progressSpy).toHaveBeenLastCalledWith({
      active: false,
      added: 0,
      total: 0,
    })
  })

  it('saves an empty page without committing', async () => {
    const provider = makeProvider([makePage([], false, 7)])

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'synced', pages: 1 })
    expect(addSpy).not.toHaveBeenCalled()
    expect(flushSpy).not.toHaveBeenCalled()
    expect(vi.mocked(save)).toHaveBeenCalledWith(fakeLiveStore, 'test', {
      scanStatus: SCAN,
      cursor: 7,
      complete: true,
      pageSize: 50,
    })
  })

  it('does not advance resume state when a flush fails', async () => {
    flushSpy.mockRejectedValue(new Error('flush boom'))
    const provider = makeProvider([
      makePage([{ id: 't1' } as unknown as NormalizedMedia], true, 1),
      makePage([{ id: 't2' } as unknown as NormalizedMedia], false, 2),
    ])

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'failed', pages: 0 })
    expect(addSpy).toHaveBeenCalledTimes(1)
    expect(vi.mocked(save)).not.toHaveBeenCalled()
  })

  it('treats a provider crash mid-stream as failed without cleanup', async () => {
    let calls = 0
    const crashyStream: TestStream = {
      next: async () => {
        calls++
        if (calls === 1) {
          return {
            done: false,
            value: makePage(
              [{ id: 't1' } as unknown as NormalizedMedia],
              true,
              1,
            ),
          }
        }
        throw new Error('provider crash mid-stream')
      },
      throw: (e: unknown) => Promise.reject(e),
      return: vi.fn(async () => ({ done: true, value: undefined })),
      [Symbol.asyncIterator]() {
        return this
      },
    }
    const provider: FakedProvider = {
      providerKey: 'crashy',
      search: vi.fn(),
      getScanStatus: vi.fn(async (): Promise<ScanStatus> => ({
        ...SCAN,
        scanning: false,
      })),
      streamAlbumsSince: vi.fn(() => crashyStream),
    }

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'failed', pages: 0 })
    expect(vi.mocked(save)).toHaveBeenCalledTimes(1)
    expect(crashyStream.return).not.toHaveBeenCalled()
  })

  it('treats a scan-status failure as failed', async () => {
    const provider = makeProvider([])
    provider.getScanStatus.mockRejectedValue(new Error('scan boom'))

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'failed', pages: 0 })
    expect(provider.streamAlbumsSince).not.toHaveBeenCalled()
  })

  it('treats a resume-state write failure as failed', async () => {
    vi.mocked(save).mockRejectedValue(new Error('save boom'))
    const provider = makeProvider([makePage([], false, 1)])

    const result = await syncProvider(
      fakeLiveStore,
      'test',
      provider as StreamingProvider,
    )

    expect(result).toEqual({ status: 'failed', pages: 0 })
  })

  describe('isStreamingProvider', () => {
    it('accepts a provider with both capabilities', () => {
      expect(isStreamingProvider(makeProvider([]))).toBe(true)
    })

    it('rejects a provider missing a capability', () => {
      const full = makeProvider([])
      const noScan: Partial<StreamingProvider> = {
        providerKey: 'x',
        streamAlbumsSince: full.streamAlbumsSince,
      }
      const noStream: Partial<StreamingProvider> = {
        providerKey: 'x',
        getScanStatus: full.getScanStatus,
      }
      expect(isStreamingProvider(noScan)).toBe(false)
      expect(isStreamingProvider(noStream)).toBe(false)
    })
  })
})
