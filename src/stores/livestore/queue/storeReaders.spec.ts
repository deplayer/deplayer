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
import { readQueue, resolveCurrentPlayingSongId, assembleQueueState } from './storeReaders'
import { encodePermutation, permutationOf } from './resolution'
import { ORDERED_LIST } from './types'
import type { QueueHeadRow, QueueItemRow } from './types'

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
  randomOrder: null,
  updatedAt: new Date(),
  ...overrides,
})

const makeItemRow = (position: number, trackId: string) => ({
  id: `default:${ORDERED_LIST}:${position}`,
  queueId: 'default',
  list: ORDERED_LIST,
  position,
  trackId,
})

/**
 * The head row's `randomOrder` blob is derived from the fixture's ordered +
 * random lists, mirroring what the QueueUpdated materializer stores. `random`
 * is the shuffled *track id* list, as the event carries it.
 */
function withPermutation(fix: QueueFixture): QueueFixture {
  if (!fix.head) return fix
  const random = fix.random ?? []
  return {
    ...fix,
    head: {
      ...fix.head,
      randomOrder:
        random.length > 0
          ? encodePermutation(permutationOf(fix.ordered ?? [], random))
          : null,
    },
  }
}

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
    // Only the ordered list is materialized as rows.
    return (fix.ordered ?? []).map((t, i) => makeItemRow(i, t))
  }
  throw new Error(`Unrouted query: ${label}`)
}

/**
 * Route a raw query object ({query, bindValues}) against the fixture. Used by
 * `resolveCurrentPlayingSongId`, which issues a head lookup and a point item
 * lookup (always against the ordered list now).
 */
function routeRawQuery(fix: QueueFixture, arg: { query: string; bindValues?: unknown[] }): Record<string, unknown>[] {
  if (arg.query.includes('FROM queue WHERE')) {
    return fix.head ? [fix.head] : []
  }
  if (arg.query.includes('FROM queue_items')) {
    const position = Number(arg.bindValues?.[2])
    const trackId = (fix.ordered ?? [])[position]
    return trackId === undefined ? [] : [{ trackId }]
  }
  throw new Error(`Unrouted raw query: ${arg.query}`)
}

const makeStore = (fixture: QueueFixture = {}): FakeStore => {
  const fix = withPermutation(fixture)
  return {
    query: vi.fn((arg: unknown) => {
      const a = arg as { label?: string; hash?: string; query?: string; bindValues?: unknown[] }
      if (typeof a.query === 'string') return routeRawQuery(fix, a as { query: string; bindValues?: unknown[] })
      return routeDefQuery(fix, a as { label?: string; hash?: string })
    }),
    commit: vi.fn(async () => undefined),
  }
}

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
      head: makeHead({ currentTrackId: '', repeat: true }),
      // Deliberately out of order — readQueue must sort by position.
      ordered: ['b', 'x'],
    })
    expect(await readQueue(store as unknown as LiveStore)).toEqual({
      trackIds: ['b', 'x'],
      randomTrackIds: [],
      currentPlaying: 0,
      currentTrackId: null,
      shuffle: false,
      repeat: true,
    })
  })

  it('falls back to the ordered list when shuffle is on with no stored permutation', async () => {
    // The append path omits randomTrackIds, so shuffle can be on with no
    // order stored. The active list must then BE the ordered list: the UI
    // renders it and the step actions walk it, matching deriveCurrentTrackId.
    const store = makeStore({
      head: makeHead({ shuffle: true }),
      ordered: ['a', 'b'],
    })
    expect(await readQueue(store as unknown as LiveStore)).toEqual({
      trackIds: ['a', 'b'],
      randomTrackIds: ['a', 'b'],
      currentPlaying: 0,
      currentTrackId: null,
      shuffle: true,
      repeat: false,
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

describe('assembleQueueState memoization', () => {
  const head = makeHead() as unknown as QueueHeadRow
  const rows = [makeItemRow(0, 'a'), makeItemRow(1, 'b')] as unknown as QueueItemRow[]

  it('returns the same object for the same input references', () => {
    // useQuery hands back stable references across re-renders that the query
    // did not cause, so a re-render must not rebuild the track list.
    const first = assembleQueueState(head, rows)
    expect(assembleQueueState(head, rows)).toBe(first)
  })

  it('recomputes when the head row or the item rows change', () => {
    const first = assembleQueueState(head, rows)
    expect(assembleQueueState({ ...head } as QueueHeadRow, rows)).not.toBe(first)
    const second = assembleQueueState(head, rows)
    expect(assembleQueueState(head, [...rows])).not.toBe(second)
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

  it('maps the shuffled position through the permutation when shuffle is on', () => {
    const store = makeStore({
      head: makeHead({ currentPlaying: 1, currentTrackId: null, shuffle: true }),
      ordered: ['song-1', 'song-2', 'song-3'],
      random: ['song-3', 'song-1', 'song-2'],
    })
    // permutation [2,0,1]: active position 1 -> ordered index 0 -> 'song-1'.
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
