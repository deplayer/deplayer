import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'
import { syncMediaLibrary } from './index'
import { batchedMediaCommitter } from '../../stores/livestore/services/BatchedMediaCommitter'

const addSpy = vi.spyOn(batchedMediaCommitter, 'add').mockResolvedValue(undefined)
const flushSpy = vi.spyOn(batchedMediaCommitter, 'flush').mockResolvedValue(undefined)
const refreshSpy = vi.spyOn(batchedMediaCommitter, 'refresh').mockResolvedValue(undefined)

const fakeLiveStore = { id: 'test-store' }

vi.mock('../../stores/livestore/accessor', () => ({
  getLiveStoreInstance: vi.fn(() => fakeLiveStore),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registeredProviders: Record<string, any> = {}

vi.mock('../../services/ProvidersService', () => ({
  default: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.providers = { ...registeredProviders }
  }),
}))

vi.mock('../selectors', () => ({
  getSettingsFromLiveStore: vi.fn().mockReturnValue({ providers: { test: { enabled: true } } }),
}))

function registerProvider(key: string, pages: Array<{ media: unknown[]; hasMore: boolean; nextCursor: number }>) {
  const p = {
    providerKey: key,
    getScanStatus: vi.fn().mockResolvedValue({ scanning: false, count: 100, lastScan: '2026-07-17T00:00:00Z' }),
    streamAlbumsSince: vi.fn().mockReturnValue(
      (async function* () { for (const page of pages) yield page })(),
    ),
  }
  registeredProviders[key] = p
  return p
}

describe('syncMediaLibrary deferred refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const k of Object.keys(registeredProviders)) delete registeredProviders[k]
    addSpy.mockResolvedValue(undefined)
    flushSpy.mockResolvedValue(undefined)
    refreshSpy.mockResolvedValue(undefined)
  })

  afterEach(() => {
    for (const k of Object.keys(registeredProviders)) delete registeredProviders[k]
  })

  it('calls add and flush with skipRefresh, refresh once at end', async () => {
    registerProvider('test', [
      { media: [{ id: 't1' }], hasMore: false, nextCursor: 1 },
    ])

    await expectSaga(syncMediaLibrary)
      .silentRun(2000)

    expect(addSpy.mock.calls.length).toBeGreaterThanOrEqual(1)
    for (const call of addSpy.mock.calls) {
      expect(call[1]).toEqual({ skipRefresh: true })
    }

    for (const call of flushSpy.mock.calls) {
      expect(call[0]).toEqual({ skipRefresh: true })
    }

    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).toHaveBeenCalledWith('SyncSaga.syncMediaLibrary')
  })

  it('refresh is still called via finally after a provider error', async () => {
    registeredProviders['faulty'] = {
      providerKey: 'faulty',
      getScanStatus: vi.fn().mockResolvedValue({ scanning: false, count: 50, lastScan: '2026-07-17T00:00:00Z' }),
      streamAlbumsSince: vi.fn().mockReturnValue(
        (async function* () {
          yield { media: [{ id: 'f1' }], hasMore: true, nextCursor: 1 }
          throw new Error('provider crash mid-stream')
        })(),
      ),
    }

    await expectSaga(syncMediaLibrary)
      .silentRun(2000)

    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).toHaveBeenCalledWith('SyncSaga.syncMediaLibrary')
  })

  it('does not advance sync_state when flush fails', async () => {
    const commitSpy = vi.fn()
    // @ts-expect-error test seam
    fakeLiveStore.commit = commitSpy
    flushSpy.mockRejectedValue(new Error('flush boom'))
    registerProvider('test', [
      { media: [{ id: 'p1' }], hasMore: true, nextCursor: 1 },
      { media: [{ id: 'p2' }], hasMore: false, nextCursor: 2 },
    ])

    await expectSaga(syncMediaLibrary)
      .silentRun(2000)

    // No sync_state write may happen for a page whose flush failed:
    // advancing the cursor would permanently skip those items.
    expect(commitSpy).not.toHaveBeenCalled()
    expect(refreshSpy).toHaveBeenCalledTimes(1)
  })
})
