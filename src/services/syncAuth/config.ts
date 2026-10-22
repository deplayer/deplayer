/**
 * Sync backend URL resolution.
 *
 * Two sources, in priority order (highest first):
 * 1. The worker URL stored in Settings (per device, localStorage) — lets a
 *    user point any app build at their own self-hosted sync worker.
 * 2. `VITE_LIVESTORE_SYNC_URL` (build time) — pre-configured deployments
 *    (e.g. the hosted deplayer.app build points at the hosted worker).
 *
 * When neither is set the store runs fully local.
 */
export const BUILD_SYNC_URL: string | undefined = import.meta.env.VITE_LIVESTORE_SYNC_URL

const STORED_SYNC_URL_KEY = 'deplayer-sync-url'

/** The worker URL stored in Settings, or `undefined` when absent/blank. */
export const getStoredSyncUrl = (): string | undefined => {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORED_SYNC_URL_KEY)
  } catch {
    return undefined
  }
  const trimmed = raw?.trim()
  return trimmed === '' ? undefined : trimmed
}

export const setStoredSyncUrl = (url: string): void => {
  localStorage.setItem(STORED_SYNC_URL_KEY, url.trim())
}

export const clearStoredSyncUrl = (): void => {
  localStorage.removeItem(STORED_SYNC_URL_KEY)
}

/**
 * The active sync backend URL: the stored setting wins over the build-time
 * default; `undefined` means "no sync, local-only store".
 */
export const getSyncUrl = (): string | undefined => {
  return getStoredSyncUrl() ?? BUILD_SYNC_URL
}
