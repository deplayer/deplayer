import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { expectSaga } from 'redux-saga-test-plan'
import { syncMediaLibrary } from './index'
import { batchedMediaCommitter } from '../../stores/livestore/services/BatchedMediaCommitter'
import { syncProvider } from '../../stores/livestore/services/ProviderSync'

const refreshSpy = vi.spyOn(batchedMediaCommitter, 'refresh').mockResolvedValue(undefined)

const fakeLiveStore = { id: 'test-store' }

vi.mock('../../stores/livestore/accessor', () => ({
  getLiveStoreInstance: vi.fn(() => fakeLiveStore),
}))

// ProviderSync owns the per-provider streaming policy (page loop, resume
// saves, skipRefresh commits, cursor advancement) — tested in
// stores/livestore/services/ProviderSync.spec.ts. This spec verifies only the
// saga-level contract: one final deferred refresh per sync run, also after a
// provider failure.
vi.mock('../../stores/livestore/services/ProviderSync', () => ({
  syncProvider: vi.fn(async () => ({ status: 'synced', pages: 1 })),
  isStreamingProvider: vi.fn(() => true),
}))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registeredProviders: Record<string, any> = {}

vi.mock('../../services/ProvidersService', () => ({
  default: vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.providers = { ...registeredProviders }
  }),
}))

vi.mock('../selectors', () => ({
  getSettingsFromLiveStore: vi.fn().mockImplementation(() =>
    // eslint-disable-next-line require-yield -- immediate-value generator: the delegating saga resumes synchronously with the settings
    (function* settingsMock() { return { providers: { test: { enabled: true } } } })()
  ),
}))

function registerProvider(key: string): void {
  registeredProviders[key] = {
    providerKey: key,
    getScanStatus: vi.fn(),
    streamAlbumsSince: vi.fn(),
  }
}

describe('syncMediaLibrary deferred refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const k of Object.keys(registeredProviders)) delete registeredProviders[k]
    refreshSpy.mockResolvedValue(undefined)
    vi.mocked(syncProvider).mockResolvedValue({ status: 'synced', pages: 1 })
  })

  afterEach(() => {
    for (const k of Object.keys(registeredProviders)) delete registeredProviders[k]
  })

  it('runs each streaming provider through syncProvider and refreshes once at the end', async () => {
    registerProvider('test')

    await expectSaga(syncMediaLibrary)
      .silentRun(2000)

    expect(syncProvider).toHaveBeenCalledTimes(1)
    const [store, key, provider] = vi.mocked(syncProvider).mock.calls[0]
    expect(store).toBe(fakeLiveStore)
    expect(key).toBe('test')
    expect(provider).toBe(registeredProviders['test'])
    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).toHaveBeenCalledWith('SyncSaga.syncMediaLibrary')
  })

  it('refresh is still called via finally after a provider error', async () => {
    registerProvider('faulty')
    vi.mocked(syncProvider).mockResolvedValue({ status: 'failed', pages: 0 })

    await expectSaga(syncMediaLibrary)
      .silentRun(2000)

    expect(refreshSpy).toHaveBeenCalledTimes(1)
    expect(refreshSpy).toHaveBeenCalledWith('SyncSaga.syncMediaLibrary')
  })
})
