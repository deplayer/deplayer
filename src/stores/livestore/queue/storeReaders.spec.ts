/**
 * Tests for the synchronous queue store readers: `readQueue` (canonical
 * normalized read) and `resolveCurrentPlayingSongId` (non-reactive direct
 * queue-table lookup). The fake store routes queries by the generated SQL
 * (for queryDb defs) or the raw query text (for resolve's raw queries), so
 * assertions are on observable behavior only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import type { LiveStore } from '../accessor'
import { readQueue, resolveCurrentPlayingSongId } from './storeReaders'

interface FakeStore {
  query: Mock
  commit: Mock
}

interface QueueFixture {
  head?: Record<string, unknown>
  ordered?: string[]
  random?: string[]
}

const makeHead = (overrides: Record<string, unknown> = {}) => ({
  id: 'default',
  currentPlaying: 0,
  currentTrackId: null,
  shuffle: false,
  repeat: false,
  updatedAt: new Date(),
  ...overrides,
})

const makeItemRow = (list: string, position: number, trackId: string) => ({
  id: `default:${list}:${position}`,
  queueId: 'default',
  list,
  position,
  trackId,
})

const listFor = (fix: QueueFixture, list: string): string[] =>
  list === 'random' ? (fix.random ?? []) : (fix.ordered ?? [])

/**
 * Route a queryDb def (label = generated SQL) against the fixture. Used by
 * `readQueue`, which issues a head query and an items query.
 */
function routeDefQuery(fix: QueueFixture, def: { label?: string; hash?: string }): Record<string, unknown>[] {
  const label = def.label ?? ''
  if (label.includes('FROM \'queue\' WHERE "id"')) {
    return fix.head ? [fix.head] : []
  }
  if (label.includes('FROM \'queue_items\'')) {
    return [
      ...listFor(fix, 'ordered').map((t, i) => makeItemRow('ordered', i, t)),
      ...listFor(fix, 'random').map((t, i) => makeItemRow('random', i, t)),
    ]
  }
  throw new Error(`Unrouted query: ${label}`)
}

/**
 * Route a raw query object ({query, bindValues}) against the fixture. Used by
 * `resolveCurrentPlayingSongId`, which issues a head lookup and a point item
 * lookup.
 */
function routeRawQuery(fix: QueueFixture, arg: { query: string; bindValues?: unknown[] }): Record<string, unknown>[] {
  if (arg.query.includes('FROM queue WHERE')) {
    return fix.head ? [fix.head] : []
  }
  if (arg.query.includes('FROM queue_items')) {
    const [, list, position] = arg.bindValues ?? []
    const trackId = listFor(fix, String(list))[Number(position)]
    return trackId === undefined ? [] : [{ trackId }]
  }
  throw new Error(`Unrouted raw query: ${arg.query}`)
}

const makeStore = (fix: QueueFixture = {}): FakeStore => ({
  query: vi.fn((arg: unknown) => {
    const a = arg as { label?: string; hash?: string; query?: string; bindValues?: unknown[] }
    if (typeof a.query === 'string') return routeRawQuery(fix, a as { query: string; bindValues?: unknown[] })
    return routeDefQuery(fix, a as { label?: string; hash?: string })
  }),
  commit: vi.fn(async () => undefined),
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readQueue', () => {
  it('returns null when no head row exists', async () => {
    expect(await readQueue(makeStore() as unknown as LiveStore)).toBeNull()
  })

  it('normalizes head row plus item rows into QueueState', async () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: 1, shuffle: true, repeat: false }),
      ordered: ['a', 'b'],
      random: ['b', 'a'],
    })
    expect(await readQueue(store as unknown as LiveStore)).toEqual({
      trackIds: ['a', 'b'],
      randomTrackIds: ['b', 'a'],
      currentPlaying: 1,
      currentTrackId: null,
      shuffle: true,
      repeat: false,
    })
  })

  it('treats an empty-string currentTrackId as null and sorts item rows by position', async () => {
    const store = makeStore({
      head: makeHead({ currentTrackId: '', shuffle: true, repeat: true }),
      // Deliberately out of order — readQueue must sort by position.
      ordered: ['b', 'x'],
      random: [],
    })
    expect(await readQueue(store as unknown as LiveStore)).toEqual({
      trackIds: ['b', 'x'],
      randomTrackIds: [],
      currentPlaying: 0,
      currentTrackId: null,
      shuffle: true,
      repeat: true,
    })
  })

  it('returns the persisted currentTrackId when present', async () => {
    const store = makeStore({
      head: makeHead({ currentTrackId: 'pinned' }),
      ordered: ['a', 'b'],
    })
    expect((await readQueue(store as unknown as LiveStore))?.currentTrackId).toBe('pinned')
  })

  it('returns null and logs when the query fails', async () => {
    const store = makeStore()
    store.query.mockRejectedValue(new Error('db closed'))
    expect(await readQueue(store as unknown as LiveStore)).toBeNull()
    expect(console.error).toHaveBeenCalled()
  })
})

describe('resolveCurrentPlayingSongId', () => {
  it('returns null when liveStore getter returns null', () => {
    expect(resolveCurrentPlayingSongId(() => null)).toBeNull()
  })

  it('binds the queue id positionally (object binds never reach the ?)', () => {
    const store = makeStore({ head: makeHead() })
    resolveCurrentPlayingSongId(() => store as unknown as LiveStore)
    const queryArg = store.query.mock.calls[0][0] as { bindValues: unknown }
    expect(queryArg.bindValues).toEqual(['default'])
  })

  it('returns null when queue table is empty', () => {
    const store = makeStore()
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBeNull()
  })

  it('resolves song ID using currentTrackId (authoritative)', () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: 0, currentTrackId: 'song-authorized', shuffle: false }),
      ordered: ['song-1', 'song-2', 'song-3'],
    })
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBe('song-authorized')
  })

  it('falls back to the queue_items point read when currentTrackId is null', () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: 2, currentTrackId: null, shuffle: false }),
      ordered: ['song-1', 'song-2', 'song-3'],
    })
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBe('song-3')
  })

  it('falls back to the queue_items point read when currentTrackId is undefined', () => {
    const store = makeStore({
      // currentTrackId omitted from the head row → undefined
      head: { id: 'default', currentPlaying: 1, shuffle: false },
      ordered: ['song-1', 'song-2', 'song-3'],
    })
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBe('song-2')
  })

  it('uses the random list point read when shuffle is on', () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: 1, currentTrackId: null, shuffle: true }),
      ordered: ['song-1', 'song-2', 'song-3'],
      random: ['song-3', 'song-1', 'song-2'],
    })
    // Shuffle is on, so position 1 resolves into the random list.
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBe('song-1')
  })

  it('returns null when currentPlaying is null', () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: null, currentTrackId: null, shuffle: false }),
      ordered: ['song-1', 'song-2'],
    })
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBeNull()
  })

  it('returns null when the point read finds no item row', () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: 7, currentTrackId: null, shuffle: false }),
      ordered: ['song-1', 'song-2'],
    })
    expect(resolveCurrentPlayingSongId(() => store as unknown as LiveStore)).toBeNull()
  })
})
