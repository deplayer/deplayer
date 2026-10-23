import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { makeTestStore, type TestLiveStore } from '../test-utils/liveStore'
import { createTestMedia } from '../test-utils/factories'
import { playAllAction, toggleShuffleAction } from '../stores/livestore/queue'
import type { LiveStore } from '../stores/livestore/accessor'
import { PlaybackController, createLiveStorePlaybackDataPort, type PlaybackResult } from './PlaybackController'

/** SQL text of a store.query argument: raw `{ query }` objects or queryDb defs (`label`). */
const sqlOf = (arg: unknown): string => {
  if (arg && typeof arg === 'object') {
    if ('query' in arg && typeof arg.query === 'string') return arg.query
    if ('label' in arg && typeof arg.label === 'string') return arg.label
  }
  return ''
}

const startedId = (result: PlaybackResult) => (result.status === 'started' ? result.songId : null)

describe('PlaybackController step against a real LiveStore', () => {
  let testStore: TestLiveStore
  let store: LiveStore

  beforeEach(async () => {
    testStore = await makeTestStore()
    // Test-only bridge: the app's LiveStore alias is the same Store with a looser schema type.
    store = testStore as unknown as LiveStore
  })

  afterEach(async () => {
    await testStore.shutdownPromise()
  })

  for (const shuffle of [false, true]) {
    it(`next()/previous() play the stepped track without reading the whole queue (shuffle=${shuffle})`, async () => {
      await playAllAction(store, ['a', 'b', 'c', 'd'])
      if (shuffle) await toggleShuffleAction(store, true)

      const ctrl = new PlaybackController({
        data: {
          ...createLiveStorePlaybackDataPort(() => store),
          readMedia: async (id) => createTestMedia({ id }),
        },
        transport: { stop: vi.fn(), play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), toggle: vi.fn() },
        dispatch: vi.fn(),
        setBackgroundImage: vi.fn(),
        resolveStream: async (media) => ({ url: `https://example.com/${media.id}.mp3`, kind: 'remote' }),
      })

      const first = (await store.query({ query: 'SELECT currentTrackId FROM queue', bindValues: [] })) as Array<{ currentTrackId: string }>
      const querySpy = vi.spyOn(store, 'query')

      const next = await ctrl.next()
      const prev = await ctrl.previous()

      // Any queue_items read must be a point read; an unfiltered select is O(queue length).
      const fullScans = querySpy.mock.calls
        .map((call) => sqlOf(call[0]))
        .filter((sql) => sql.includes('queue_items') && !/"?(position|trackId)"?\s*=/.test(sql))
      expect(fullScans).toEqual([])

      expect(startedId(next)).not.toBeNull()
      expect(startedId(next)).not.toBe(first[0].currentTrackId)
      expect(startedId(prev)).toBe(first[0].currentTrackId)
    })
  }
})
