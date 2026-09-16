/**
 * Tests for the LiveStore queue action adapters.
 *
 * The transition logic itself is covered by ./transitions.spec.ts; these
 * tests verify the adapter boundary: what each action reads, which event it
 * commits (or deliberately does not), and which console warnings it emits.
 * A fake store records committed events so assertions are on observable
 * behavior only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Mock } from 'vitest'
import type { LiveStore } from '../accessor'
import {
  playAllAction,
  addToQueueAction,
  addNextAction,
  removeFromQueueAction,
  clearQueueAction,
  toggleShuffleAction,
  toggleRepeatAction,
  setCurrentPlayingAction,
  playNextAction,
  playPreviousAction,
  playMediaAction,
} from './actions'

interface FakeStore {
  query: Mock
  commit: Mock
}

const makeStore = (rows: unknown[] = []): FakeStore => ({
  query: vi.fn(async () => rows),
  commit: vi.fn(async () => undefined),
})

/** Raw queue row as stored in the DB. */
const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'default',
  trackIds: JSON.stringify(['a', 'b', 'c']),
  randomTrackIds: null,
  currentPlaying: 0,
  currentTrackId: null,
  shuffle: false,
  repeat: false,
  updatedAt: new Date(),
  ...overrides,
})

const committed = (store: FakeStore) => store.commit.mock.calls.map((c) => c[0])

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('playAllAction', () => {
  it('warns and commits nothing when no tracks are provided', async () => {
    const store = makeStore()
    await playAllAction(store as unknown as LiveStore, [])
    expect(console.warn).toHaveBeenCalledWith('playAllAction: No tracks provided')
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('commits a queueUpdated event resetting the queue', async () => {
    const store = makeStore([makeRow()])
    await playAllAction(store as unknown as LiveStore, ['x', 'y'])
    expect(store.commit).toHaveBeenCalledTimes(1)
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueueUpdated')
    expect(ev.args).toEqual({
      id: 'default',
      trackIds: ['x', 'y'],
      currentPlaying: 0,
      shuffle: false,
      repeat: false,
    })
  })
})

describe('addToQueueAction', () => {
  it('commits nothing for an empty track list', async () => {
    const store = makeStore([makeRow()])
    await addToQueueAction(store as unknown as LiveStore, [])
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('fresh-creates the queue and commits without awaiting (preserved fire-and-forget)', async () => {
    const store = makeStore([])
    let resolveCommit!: () => void
    store.commit.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCommit = resolve })
    )

    const done = await addToQueueAction(store as unknown as LiveStore, ['x'])
    // The action resolved while the commit promise is still pending.
    expect(done).toBeUndefined()
    expect(store.commit).toHaveBeenCalledTimes(1)
    resolveCommit()
  })

  it('appends to an existing queue and awaits the commit', async () => {
    const store = makeStore([makeRow({ currentPlaying: 1, shuffle: true, repeat: true })])
    await addToQueueAction(store as unknown as LiveStore, ['d'])
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueueUpdated')
    // randomTrackIds is deliberately omitted (suspected bug #1, locked in).
    expect(ev.args).toEqual({
      id: 'default',
      trackIds: ['a', 'b', 'c', 'd'],
      currentPlaying: 1,
      shuffle: true,
      repeat: true,
    })
  })

  it('propagates commit rejections on the append path (awaited)', async () => {
    const store = makeStore([makeRow()])
    store.commit.mockRejectedValue(new Error('commit failed'))
    await expect(addToQueueAction(store as unknown as LiveStore, ['d'])).rejects.toThrow(
      'commit failed'
    )
  })
})

describe('addNextAction', () => {
  it('returns null and commits nothing for an empty track list', async () => {
    const store = makeStore([makeRow()])
    expect(await addNextAction(store as unknown as LiveStore, [])).toBeNull()
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('starts a fresh queue and returns the first track id', async () => {
    const store = makeStore([])
    const first = await addNextAction(store as unknown as LiveStore, ['x', 'y'])
    expect(first).toBe('x')
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueueUpdated')
    expect(ev.args.trackIds).toEqual(['x', 'y'])
    expect(ev.args.currentPlaying).toBe(0)
  })

  it('inserts after the currently playing track and commits no firstTrackId', async () => {
    const store = makeStore([makeRow({ currentPlaying: 1 })])
    const first = await addNextAction(store as unknown as LiveStore, ['d'])
    expect(first).toBeNull()
    const [ev] = committed(store)
    expect(ev.args.trackIds).toEqual(['a', 'b', 'd', 'c'])
    expect(ev.args.currentPlaying).toBe(1)
  })

  it('inserts at the front when there is no current position', async () => {
    const store = makeStore([makeRow({ currentPlaying: null })])
    await addNextAction(store as unknown as LiveStore, ['d'])
    const [ev] = committed(store)
    expect(ev.args.trackIds).toEqual(['d', 'a', 'b', 'c'])
  })
})

describe('removeFromQueueAction', () => {
  it('commits nothing when there is no queue', async () => {
    const store = makeStore([])
    await removeFromQueueAction(store as unknown as LiveStore, 'a')
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('removes all occurrences and clamps currentPlaying', async () => {
    const store = makeStore([makeRow({ trackIds: JSON.stringify(['a', 'b', 'a']), currentPlaying: 2 })])
    await removeFromQueueAction(store as unknown as LiveStore, 'a')
    const [ev] = committed(store)
    expect(ev.args.trackIds).toEqual(['b'])
    expect(ev.args.currentPlaying).toBe(0)
  })

  it('commits an unchanged event when the track is absent (no-op commit preserved)', async () => {
    const store = makeStore([makeRow({ currentPlaying: 1 })])
    await removeFromQueueAction(store as unknown as LiveStore, 'z')
    expect(store.commit).toHaveBeenCalledTimes(1)
    const [ev] = committed(store)
    expect(ev.args.trackIds).toEqual(['a', 'b', 'c'])
    expect(ev.args.currentPlaying).toBe(1)
  })
})

describe('clearQueueAction', () => {
  it('commits queueCleared unconditionally without reading the queue', async () => {
    const store = makeStore([])
    await clearQueueAction(store as unknown as LiveStore)
    expect(store.query).not.toHaveBeenCalled()
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueueCleared')
    expect(ev.args).toEqual({ queueId: 'default' })
  })
})

describe('toggleShuffleAction', () => {
  it('warns and commits nothing when there is no queue', async () => {
    const store = makeStore([])
    await toggleShuffleAction(store as unknown as LiveStore, true)
    expect(console.warn).toHaveBeenCalledWith(
      '[toggleShuffleAction] No queue or empty queue, cannot toggle shuffle'
    )
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('warns and commits nothing when the queue is empty', async () => {
    const store = makeStore([makeRow({ trackIds: '[]', randomTrackIds: null })])
    await toggleShuffleAction(store as unknown as LiveStore, true)
    expect(console.warn).toHaveBeenCalled()
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('enables shuffle with a deterministic permutation and remaps currentPlaying', async () => {
    const store = makeStore([makeRow({ currentPlaying: 1 })])
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5)

    await toggleShuffleAction(store as unknown as LiveStore, true)
    expect(randomSpy).toHaveBeenCalledTimes(2)
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueueUpdated')
    // r=0.5 both draws: i=2 j=floor(0.5*3)=1 swap idx2/1 -> [a,c,b]; i=1 j=1 no swap
    expect(ev.args.randomTrackIds).toEqual(['a', 'c', 'b'])
    expect(ev.args.currentPlaying).toBe(2) // 'b' moved to index 2
    expect(ev.args.shuffle).toBe(true)
    expect(ev.args.trackIds).toEqual(['a', 'b', 'c'])
  })

  it('disables shuffle by remapping the shuffled position back to the plain list', async () => {
    const store = makeStore([
      makeRow({ randomTrackIds: JSON.stringify(['b', 'c', 'a']), shuffle: true, currentPlaying: 2 }),
    ])
    await toggleShuffleAction(store as unknown as LiveStore, false)
    const [ev] = committed(store)
    expect(ev.args.randomTrackIds).toEqual([])
    expect(ev.args.currentPlaying).toBe(0) // 'a' is at plain index 0
    expect(ev.args.shuffle).toBe(false)
  })
})

describe('toggleRepeatAction', () => {
  it('warns and commits nothing when there is no queue', async () => {
    const store = makeStore([])
    await toggleRepeatAction(store as unknown as LiveStore, true)
    expect(console.warn).toHaveBeenCalledWith(
      '[toggleRepeatAction] No queue exists, cannot toggle repeat'
    )
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('commits a partial repeat-toggled event', async () => {
    const store = makeStore([makeRow()])
    await toggleRepeatAction(store as unknown as LiveStore, true)
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueueRepeatToggled')
    expect(ev.args).toEqual({ queueId: 'default', repeat: true })
  })
})

describe('setCurrentPlayingAction', () => {
  it('commits a positionChanged event without reading the queue', async () => {
    const store = makeStore([])
    await setCurrentPlayingAction(store as unknown as LiveStore, 3)
    expect(store.query).not.toHaveBeenCalled()
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueuePositionChanged')
    expect(ev.args).toEqual({ queueId: 'default', position: 3 })
  })
})

describe('playNextAction', () => {
  it('warns and commits nothing when there is no queue', async () => {
    const store = makeStore([])
    await playNextAction(store as unknown as LiveStore)
    expect(console.warn).toHaveBeenCalledWith('[playNextAction] Queue default not found')
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('commits the advanced position with the resolved trackId', async () => {
    const store = makeStore([makeRow({ currentPlaying: 0 })])
    await playNextAction(store as unknown as LiveStore)
    const [ev] = committed(store)
    expect(ev.name).toBe('v1.QueuePositionChanged')
    expect(ev.args).toEqual({ queueId: 'default', position: 1, trackId: 'b' })
  })

  it('commits nothing at the end of the queue when repeat is off', async () => {
    const store = makeStore([makeRow({ currentPlaying: 2 })])
    await playNextAction(store as unknown as LiveStore)
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('wraps to position 0 when repeat is on', async () => {
    const store = makeStore([makeRow({ currentPlaying: 2, repeat: true })])
    await playNextAction(store as unknown as LiveStore)
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 0, trackId: 'a' })
  })

  it('navigates the shuffled list when shuffle is on', async () => {
    const store = makeStore([
      makeRow({ randomTrackIds: JSON.stringify(['c', 'a', 'b']), shuffle: true, currentPlaying: 1 }),
    ])
    await playNextAction(store as unknown as LiveStore)
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 2, trackId: 'b' })
  })
})

describe('playPreviousAction', () => {
  it('warns and commits nothing when there is no queue', async () => {
    const store = makeStore([])
    await playPreviousAction(store as unknown as LiveStore)
    expect(console.warn).toHaveBeenCalledWith('[playPreviousAction] Queue default not found')
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('commits the previous position with the resolved trackId', async () => {
    const store = makeStore([makeRow({ currentPlaying: 1 })])
    await playPreviousAction(store as unknown as LiveStore)
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 0, trackId: 'a' })
  })

  it('commits a stay-put event at position 0 when repeat is off (always commits)', async () => {
    const store = makeStore([makeRow({ currentPlaying: 0 })])
    await playPreviousAction(store as unknown as LiveStore)
    expect(store.commit).toHaveBeenCalledTimes(1)
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 0, trackId: 'a' })
  })

  it('wraps to the end when repeat is on at position 0', async () => {
    const store = makeStore([makeRow({ currentPlaying: 0, repeat: true })])
    await playPreviousAction(store as unknown as LiveStore)
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 2, trackId: 'c' })
  })

  it('emits an undefined trackId for an empty active list (suspected bug #1, locked in)', async () => {
    const store = makeStore([makeRow({ trackIds: '[]', randomTrackIds: null })])
    await playPreviousAction(store as unknown as LiveStore)
    expect(store.commit).toHaveBeenCalledTimes(1)
    const [ev] = committed(store)
    expect(ev.args.position).toBe(0)
    expect(ev.args.trackId).toBeUndefined()
  })
})

describe('playMediaAction', () => {
  it('warns and commits nothing when there is no queue', async () => {
    const store = makeStore([])
    await playMediaAction(store as unknown as LiveStore, 'a')
    expect(console.warn).toHaveBeenCalledWith('[playMediaAction] Queue default not found')
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('commits the found position with the trackId', async () => {
    const store = makeStore([makeRow({ currentPlaying: null })])
    await playMediaAction(store as unknown as LiveStore, 'c')
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 2, trackId: 'c' })
  })

  it('warns and commits nothing when the media is not in the active list', async () => {
    const store = makeStore([makeRow()])
    await playMediaAction(store as unknown as LiveStore, 'z')
    expect(console.warn).toHaveBeenCalledWith('[playMediaAction] Media z not found in queue')
    expect(store.commit).not.toHaveBeenCalled()
  })

  it('finds the track through the shuffled list when shuffle is on', async () => {
    const store = makeStore([
      makeRow({ randomTrackIds: JSON.stringify(['c', 'a', 'b']), shuffle: true, currentPlaying: null }),
    ])
    await playMediaAction(store as unknown as LiveStore, 'b')
    const [ev] = committed(store)
    expect(ev.args).toEqual({ queueId: 'default', position: 2, trackId: 'b' })
  })
})
