import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BUILD_SYNC_URL,
  clearStoredSyncUrl,
  getStoredSyncUrl,
  getSyncUrl,
  setStoredSyncUrl
} from './config'

describe('sync backend URL resolution', () => {
  beforeEach(() => {
    clearStoredSyncUrl()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearStoredSyncUrl()
  })

  it('falls back to the build-time default when nothing is stored', () => {
    expect(getStoredSyncUrl()).toBeUndefined()
    expect(getSyncUrl()).toBe(BUILD_SYNC_URL)
  })

  it('prefers the stored URL over the build-time default', () => {
    setStoredSyncUrl('https://my-worker.example.workers.dev')
    expect(getSyncUrl()).toBe('https://my-worker.example.workers.dev')
  })

  it('trims stored values and treats blank as unset', () => {
    setStoredSyncUrl('  https://a.b/  ')
    expect(getStoredSyncUrl()).toBe('https://a.b/')
    clearStoredSyncUrl()
    setStoredSyncUrl('   ')
    expect(getStoredSyncUrl()).toBeUndefined()
    expect(getSyncUrl()).toBe(BUILD_SYNC_URL)
  })

  it('stays local when storage is unavailable', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    expect(getStoredSyncUrl()).toBeUndefined()
    expect(getSyncUrl()).toBe(BUILD_SYNC_URL)
  })
})
