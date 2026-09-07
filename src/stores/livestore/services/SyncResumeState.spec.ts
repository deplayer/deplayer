import { describe, it, expect, vi } from 'vitest'
import type { Mock } from 'vitest'
import { resumeFor, save } from './SyncResumeState'
import type { SyncResume } from './SyncResumeState'

interface FakeSyncStore {
  query: Mock
  commit: Mock
}

type Row = unknown[]

// SQLite row shape: [lastSyncTimestamp, lastKnownCount, initialSyncCursor, initialSyncComplete, cursorPageSize]
const rowValues = (over: Partial<SyncResume> = {}): Row => [
  over.lastSyncTimestamp ?? '2026-07-01T00:00:00Z',
  over.lastKnownCount ?? 100,
  over.initialSyncCursor ?? 0,
  (over.initialSyncComplete ?? false) ? 1 : 0,
  over.cursorPageSize ?? 0,
]

// Fake store whose query selects by the bound row id (bindValues[1]).
const makeStore = (rows: Record<string, Row[]> = {}): FakeSyncStore => ({
  query: vi.fn(async ({ bindValues }: { bindValues: Record<number, string> }) => [
    { values: rows[bindValues[1]] ?? [] },
  ]),
  commit: vi.fn(async () => undefined),
})

const SCAN = { scanning: false, count: 100, lastScan: '2026-07-01T00:00:00Z' }

const commitJson = (store: FakeSyncStore): string =>
  JSON.stringify(store.commit.mock.calls[0]?.[0]) ?? ''

describe('resumeFor', () => {
  it('returns null boundaries and commits nothing when no rows exist', async () => {
    const store = makeStore()
    const decision = await resumeFor(store as never, 'subsonic', SCAN, 50)
    expect(decision).toEqual({ since: null, cursor: null })
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('adopts the legacy default row once, under the provider key', async () => {
    const store = makeStore({ default: [rowValues({ initialSyncCursor: 150 })] })
    const decision = await resumeFor(store as never, 'subsonic', SCAN, 50)

    // Adoption writes the legacy progress under the provider key.
    expect(store.commit).toHaveBeenCalledTimes(1)
    const json = commitJson(store)
    expect(json).toContain('v2.SyncStateUpdated')
    expect(json).toContain('"subsonic"')
    expect(json).toContain('150')

    // Legacy rows have unknown geometry (0), so a positive cursor restarts the walk.
    expect(decision.since).toBe('2026-07-01T00:00:00Z')
    expect(decision.cursor).toBe(null)
  })

  it('prefers the provider row over the legacy row', async () => {
    const store = makeStore({
      subsonic: [rowValues({ initialSyncCursor: 200, cursorPageSize: 50 })],
      default: [rowValues({ initialSyncCursor: 999 })],
    })
    const decision = await resumeFor(store as never, 'subsonic', SCAN, 50)
    expect(store.commit).not.toHaveBeenCalled()
    expect(decision).toEqual({ since: '2026-07-01T00:00:00Z', cursor: 200 })
  })

  it('resets the cursor but keeps since when cursor geometry changed', async () => {
    const store = makeStore({ subsonic: [rowValues({ initialSyncCursor: 200, cursorPageSize: 100 })] })
    const decision = await resumeFor(store as never, 'subsonic', SCAN, 50)
    expect(decision).toEqual({ since: '2026-07-01T00:00:00Z', cursor: null })
  })

  it('resets both boundaries when the server row count dropped', async () => {
    const store = makeStore({ subsonic: [rowValues({ lastKnownCount: 100, initialSyncCursor: 200, cursorPageSize: 50 })] })
    const decision = await resumeFor(store as never, 'subsonic', { ...SCAN, count: 50 }, 50)
    expect(decision).toEqual({ since: null, cursor: null })
  })

  it('resets both boundaries when the server scan is older than the stored one', async () => {
    const store = makeStore({ subsonic: [rowValues({ lastSyncTimestamp: '2026-07-02T00:00:00Z', cursorPageSize: 50 })] })
    const decision = await resumeFor(store as never, 'subsonic', SCAN, 50)
    expect(decision).toEqual({ since: null, cursor: null })
  })

  it('degrades to null boundaries when the store cannot be read', async () => {
    const store = { query: vi.fn(async () => { throw new Error('db closed') }), commit: vi.fn() }
    const decision = await resumeFor(store as never, 'subsonic', SCAN, 50)
    expect(decision).toEqual({ since: null, cursor: null })
    expect(store.commit).not.toHaveBeenCalled()
  })
})

describe('save', () => {
  it('writes the derived resume fields under the provider key', async () => {
    const store = makeStore()
    await save(store as never, 'jellyfin', {
      scanStatus: SCAN,
      cursor: null,
      complete: true,
      pageSize: 50,
    })
    expect(store.commit).toHaveBeenCalledTimes(1)
    const json = commitJson(store)
    expect(json).toContain('v2.SyncStateUpdated')
    expect(json).toContain('"jellyfin"')
    expect(json).toContain('2026-07-01T00:00:00Z')
    expect(json).toContain('"cursorPageSize":50')
  })

  it('stores the given cursor and completion flag', async () => {
    const store = makeStore()
    await save(store as never, 'jellyfin', {
      scanStatus: SCAN,
      cursor: 42,
      complete: false,
      pageSize: 50,
    })
    const json = commitJson(store)
    expect(json).toContain('"initialSyncCursor":42')
    expect(json).toContain('"initialSyncComplete":false')
  })
})
