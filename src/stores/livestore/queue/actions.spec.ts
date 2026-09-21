import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import type { LiveStore } from '../accessor'
import { encodePermutation, permutationOf } from './resolution'
import { ORDERED_LIST } from './types'
import {
  addNextAction,
  addToQueueAction,
  clearQueueAction,
  playAllAction,
  playMediaAction,
  playNextAction,
  playPreviousAction,
  removeFromQueueAction,
  setCurrentPlayingAction,
  toggleRepeatAction,
  toggleShuffleAction,
} from './actions'

// ---------------------------------------------------------------------------
// Store fake that routes queries by the `def` object produced by queryDb:
//   def.label — the exact generated SQL text
//   def.hash  — SQL + "-<index>:<value>..." bind trail (e.g. "-1:random,2:0")
// Both are captured from the live query-builder output so the router stays
// faithful to the real SQL.
// ---------------------------------------------------------------------------

type QueryDef = { label?: string; hash?: string }

interface QueueFixture {
  head?: Record<string, unknown>
  ordered?: string[]
  random?: string[]
}

type FixtureArg = QueueFixture | string[] | null
function normalizeFixture(fixture: FixtureArg): QueueFixture {
  if (fixture === null) return {}
  if (Array.isArray(fixture)) return { head: makeHead(), ordered: fixture }
  return fixture.head ? fixture : { head: makeHead(), ...fixture }
}

function makeHead(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'default',
    currentPlaying: 0,
    currentTrackId: null,
    shuffle: false,
    repeat: false,
    randomOrder: null,
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeItemRow(position: number, trackId: string): Record<string, unknown> {
  return {
    id: `default:${ORDERED_LIST}:${position}`,
    queueId: 'default',
    list: ORDERED_LIST,
    position,
    trackId,
  }
}

/** Recover the bind values from the def.hash bind trail ("...-1:random,2:0"). */
function bindsFromHash(hash: string): unknown[] {
  const dash = hash.lastIndexOf('-')
  if (dash === -1) return []
  return hash
    .slice(dash + 1)
    .split(',')
    .map((part) => {
      const value = part.slice(part.indexOf(':') + 1)
      const n = Number(value)
      return value !== '' && !Number.isNaN(n) ? n : value
    })
}

function routeQuery(fix: QueueFixture, def: QueryDef): Record<string, unknown>[] {
  const label = def.label ?? ''
  const binds = bindsFromHash(def.hash ?? '')
  const ordered = fix.ordered ?? []

  if (label.includes('FROM \'queue\' WHERE "id"')) {
    return fix.head ? [fix.head] : []
  }
  // Point reads must be matched before the full-list query, which matches any
  // queue_items statement.
  if (label.includes('"trackId" = ? LIMIT')) {
    const trackId = String(binds[2])
    const position = ordered.indexOf(trackId)
    return position === -1 ? [] : [makeItemRow(position, trackId)]
  }
  if (label.includes('"position" = ? LIMIT')) {
    const position = Number(binds[2])
    const trackId = ordered[position]
    return trackId === undefined ? [] : [makeItemRow(position, trackId)]
  }
  if (label.includes('ORDER BY "position" desc')) {
    if (ordered.length === 0) return []
    return [makeItemRow(ordered.length - 1, ordered[ordered.length - 1]!)]
  }
  if (label.includes('FROM \'queue_items\'')) {
    // Only the ordered list is materialized as rows.
    return ordered.map((t, i) => makeItemRow(i, t))
  }
  throw new Error(`Unrouted query: ${label}`)
}

/**
 * The head row's `randomOrder` blob is derived from the fixture's ordered +
 * random lists, mirroring what the QueueUpdated materializer stores.
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

function makeStore(fixture: FixtureArg = null): { query: Mock; commit: Mock } {
  const fix = withPermutation(normalizeFixture(fixture))
  return {
    query: vi.fn((def: QueryDef) => routeQuery(fix, def)),
    commit: vi.fn(async () => undefined),
  }
}
function committed(store: { commit: Mock }): [string, Record<string, unknown>] {
  const event = store.commit.mock.calls[0]?.[0] as { name: string; args: Record<string, unknown> }
  return [event.name, event.args]
}

describe('queue actions', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('playAllAction', () => {
    it('warns and does not commit when there are no tracks', async () => {
      const store = makeStore()
      await playAllAction(store as unknown as LiveStore, [])
      expect(console.warn).toHaveBeenCalledWith('playAllAction: No tracks provided')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('commits a QueueUpdated event with the given track IDs', async () => {
      const store = makeStore()
      await playAllAction(store as unknown as LiveStore, ['x', 'y'])
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueUpdated')
      expect(args).toEqual({
        id: 'default',
        trackIds: ['x', 'y'],
        currentPlaying: 0,
        shuffle: false,
        repeat: false,
      })
    })
  })

  describe('addToQueueAction', () => {
    it('does not commit when the trackIds argument is empty', async () => {
      const store = makeStore(null)
      await addToQueueAction(store as unknown as LiveStore, [])
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('creates a fresh queue and commits without awaiting (preserved fire-and-forget)', async () => {
      const store = makeStore(null)
      let resolveCommit!: () => void
      store.commit.mockImplementation(
        () => new Promise<void>((resolve) => { resolveCommit = resolve }),
      )

      const done = await addToQueueAction(store as unknown as LiveStore, ['d'])
      // The action resolved while the commit promise is still pending.
      expect(done).toBeUndefined()
      expect(store.commit).toHaveBeenCalledTimes(1)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueUpdated')
      expect(args.trackIds).toEqual(['d'])
      resolveCommit()
    })

    it('appends to existing tracks preserving currentPlaying and shuffle state', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 1, shuffle: true, repeat: true }),
        ordered: ['a', 'b', 'c'],
      })
      await addToQueueAction(store as unknown as LiveStore, ['d'])
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueUpdated')
      expect(args).toEqual({
        id: 'default',
        trackIds: ['a', 'b', 'c', 'd'],
        currentPlaying: 1,
        shuffle: true,
        repeat: true,
      })
      // randomTrackIds intentionally omitted (locked suspected bug #1)
      expect(args).not.toHaveProperty('randomTrackIds')
    })

    it('rejects when the commit fails', async () => {
      const store = makeStore({ head: makeHead(), ordered: ['a'] })
      store.commit.mockRejectedValue(new Error('boom'))
      await expect(addToQueueAction(store as unknown as LiveStore, ['d'])).rejects.toThrow('boom')
    })
  })

  describe('addNextAction', () => {
    it('creates a new queue and returns the first track when no queue exists', async () => {
      const store = makeStore(null)
      const result = await addNextAction(store as unknown as LiveStore, ['d'])
      expect(result).toBe('d')
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueUpdated')
      expect(args.trackIds).toEqual(['d'])
      expect(args.currentPlaying).toBe(0)
    })

    it('inserts the new track at currentPlaying + 1', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 1 }),
        ordered: ['a', 'b', 'c'],
      })
      const result = await addNextAction(store as unknown as LiveStore, ['d'])
      expect(result).toBeNull()
      const [, args] = committed(store)
      expect(args.trackIds).toEqual(['a', 'b', 'd', 'c'])
      expect(args.currentPlaying).toBe(1)
    })

    it('inserts at index 0 when currentPlaying is null', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: null }),
        ordered: ['a', 'b', 'c'],
      })
      const result = await addNextAction(store as unknown as LiveStore, ['d'])
      expect(result).toBeNull()
      const [, args] = committed(store)
      expect(args.trackIds).toEqual(['d', 'a', 'b', 'c'])
      expect(args.currentPlaying).toBeUndefined()
    })
  })

  describe('removeFromQueueAction', () => {
    it('removes all matching occurrences and clamps currentPlaying', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 2 }),
        ordered: ['a', 'b', 'a'],
      })
      await removeFromQueueAction(store as unknown as LiveStore, 'a')
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueUpdated')
      expect(args.trackIds).toEqual(['b'])
      expect(args.currentPlaying).toBe(0)
    })

    it('commits unchanged state when the trackId is not in the queue', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 1 }),
        ordered: ['a', 'b', 'c'],
      })
      await removeFromQueueAction(store as unknown as LiveStore, 'z')
      const [, args] = committed(store)
      expect(args.trackIds).toEqual(['a', 'b', 'c'])
      expect(args.currentPlaying).toBe(1)
    })
  })

  describe('clearQueueAction', () => {
    it('commits a QueueCleared event without reading the store', async () => {
      const store = makeStore()
      await clearQueueAction(store as unknown as LiveStore)
      expect(store.query).not.toHaveBeenCalled()
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueCleared')
      expect(args).toEqual({ queueId: 'default' })
    })
  })

  describe('toggleShuffleAction', () => {
    it('warns when no queue exists', async () => {
      const store = makeStore(null)
      await toggleShuffleAction(store as unknown as LiveStore, true)
      expect(console.warn).toHaveBeenCalledWith('[toggleShuffleAction] No queue or empty queue, cannot toggle shuffle')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('warns when the queue is empty', async () => {
      const store = makeStore({ head: makeHead(), ordered: [] })
      await toggleShuffleAction(store as unknown as LiveStore, true)
      expect(console.warn).toHaveBeenCalledWith('[toggleShuffleAction] No queue or empty queue, cannot toggle shuffle')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('enables shuffle by committing a head-only permutation and re-indexing currentPlaying', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 2 }),
        ordered: ['a', 'b', 'c'],
      })
      // Two Math.random calls (both 0.6): i=2 j=1 [2,1,0]->[2,0,1]; i=1 j=1 no-op
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.6)
        .mockReturnValueOnce(0.6)
      await toggleShuffleAction(store as unknown as LiveStore, true)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueShuffleToggled')
      expect(args).toEqual({
        queueId: 'default',
        shuffle: true,
        currentPlaying: 1,
        randomOrder: [0, 2, 1],
      })
      expect(Math.random).toHaveBeenCalledTimes(2)
    })

    it('disables shuffle by clearing the permutation and re-indexing into the original order', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 2, shuffle: true }),
        ordered: ['a', 'b', 'c'],
        random: ['b', 'c', 'a'],
      })
      await toggleShuffleAction(store as unknown as LiveStore, false)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueShuffleToggled')
      expect(args).toEqual({
        queueId: 'default',
        shuffle: false,
        currentPlaying: 0,
        randomOrder: [],
      })
    })
  })

  describe('toggleRepeatAction', () => {
    it('warns when no queue exists', async () => {
      const store = makeStore(null)
      await toggleRepeatAction(store as unknown as LiveStore, true)
      expect(console.warn).toHaveBeenCalledWith('[toggleRepeatAction] No queue exists, cannot toggle repeat')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('commits a QueueRepeatToggled event', async () => {
      const store = makeStore({ head: makeHead() })
      await toggleRepeatAction(store as unknown as LiveStore, true)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueueRepeatToggled')
      expect(args).toEqual({ queueId: 'default', repeat: true })
    })
  })

  describe('setCurrentPlayingAction', () => {
    it('commits a QueuePositionChanged event without reading the store', async () => {
      const store = makeStore()
      await setCurrentPlayingAction(store as unknown as LiveStore, 3)
      expect(store.query).not.toHaveBeenCalled()
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 3 })
    })
  })

  describe('playNextAction', () => {
    it('warns when no queue exists', async () => {
      const store = makeStore(null)
      await playNextAction(store as unknown as LiveStore)
      expect(console.warn).toHaveBeenCalledWith('[playNextAction] Queue default not found')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('advances to the next position with its trackId', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 0 }),
        ordered: ['a', 'b', 'c'],
      })
      await playNextAction(store as unknown as LiveStore)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 1, trackId: 'b' })
    })

    it('does not commit at the end when repeat is off', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 2 }),
        ordered: ['a', 'b', 'c'],
      })
      await playNextAction(store as unknown as LiveStore)
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('wraps to position 0 with the first trackId when repeat is on', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 2, repeat: true }),
        ordered: ['a', 'b', 'c'],
      })
      await playNextAction(store as unknown as LiveStore)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 0, trackId: 'a' })
    })

    it('advances within the random list when shuffle is on', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 1, shuffle: true }),
        ordered: ['a', 'b', 'c'],
        random: ['c', 'a', 'b'],
      })
      await playNextAction(store as unknown as LiveStore)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 2, trackId: 'b' })
    })
  })

  describe('playPreviousAction', () => {
    it('warns when no queue exists', async () => {
      const store = makeStore(null)
      await playPreviousAction(store as unknown as LiveStore)
      expect(console.warn).toHaveBeenCalledWith('[playPreviousAction] Queue default not found')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('goes back one position with its trackId', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 1 }),
        ordered: ['a', 'b', 'c'],
      })
      await playPreviousAction(store as unknown as LiveStore)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 0, trackId: 'a' })
    })

    it('stays at position 0 when repeat is off (commits with no trackId)', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 0 }),
        ordered: ['a', 'b', 'c'],
      })
      await playPreviousAction(store as unknown as LiveStore)
      expect(store.commit).toHaveBeenCalledTimes(1)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 0, trackId: undefined })
    })

    it('wraps to the last position with its trackId when repeat is on', async () => {
      const store = makeStore({
        head: makeHead({ currentPlaying: 0, repeat: true }),
        ordered: ['a', 'b', 'c'],
      })
      await playPreviousAction(store as unknown as LiveStore)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 2, trackId: 'c' })
    })

    it('commits position 0 with no trackId for an empty list', async () => {
      const store = makeStore({ head: makeHead(), ordered: [] })
      await playPreviousAction(store as unknown as LiveStore)
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 0, trackId: undefined })
    })
  })

  describe('playMediaAction', () => {
    it('warns when no queue exists', async () => {
      const store = makeStore(null)
      await playMediaAction(store as unknown as LiveStore, 'c')
      expect(console.warn).toHaveBeenCalledWith('[playMediaAction] Queue default not found')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('jumps to the media position with its trackId', async () => {
      const store = makeStore({ ordered: ['a', 'b', 'c'] })
      await playMediaAction(store as unknown as LiveStore, 'c')
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 2, trackId: 'c' })
    })

    it('warns and does not commit when the media is not in the queue', async () => {
      const store = makeStore({ ordered: ['a', 'b', 'c'] })
      await playMediaAction(store as unknown as LiveStore, 'z')
      expect(console.warn).toHaveBeenCalledWith('[playMediaAction] Media z not found in queue')
      expect(store.commit).not.toHaveBeenCalled()
    })

    it('resolves within the random list when shuffle is on', async () => {
      const store = makeStore({
        head: makeHead({ shuffle: true }),
        ordered: ['a', 'b', 'c'],
        random: ['c', 'a', 'b'],
      })
      await playMediaAction(store as unknown as LiveStore, 'b')
      const [name, args] = committed(store)
      expect(name).toBe('v1.QueuePositionChanged')
      expect(args).toEqual({ queueId: 'default', position: 2, trackId: 'b' })
    })
  })
})
