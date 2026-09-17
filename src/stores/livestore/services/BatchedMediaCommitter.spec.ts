import { describe, it, expect, beforeEach, vi } from 'vitest'
import { batchedMediaCommitter } from './BatchedMediaCommitter'
import type { NormalizedMedia } from '../../../utils/normalizeMedia'

const makeMedia = (n: number): NormalizedMedia[] =>
  Array.from({ length: n }, (_, i) => ({
    media: { id: `m${i}`, title: `t${i}`, type: 'audio', stream: {}, genres: [] },
    artist: { id: `a${i}`, name: `A${i}` },
    album: { id: `al${i}`, name: `AL${i}`, artistId: `a${i}`, thumbnailUrl: null, year: null },
  })) as unknown as NormalizedMedia[]

const makeFakeStore = () => ({
  // Raw store.query returns row objects; the existence prefilter reads .id.
  query: vi.fn(async () => [] as Array<{ id: string }>),
  commit: vi.fn(async () => undefined),
  manualRefresh: vi.fn(),
})

describe('BatchedMediaCommitter.add', () => {
  beforeEach(() => { vi.restoreAllMocks(); batchedMediaCommitter.clear() })

  it('never lets pendingMedia exceed MAX_BATCH_SIZE before flushing', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    const peeks: number[] = []
    const origFlush = batchedMediaCommitter.flush.bind(batchedMediaCommitter)
    vi.spyOn(batchedMediaCommitter, 'flush').mockImplementation(async () => {
      peeks.push(batchedMediaCommitter.getPendingCount())
      return origFlush()
    })

    await batchedMediaCommitter.add(makeMedia(5000))
    await batchedMediaCommitter.flush()

    expect(Math.max(...peeks)).toBeLessThanOrEqual(500)
  })

  it('throws (does not spin or silently drop) when flush() keeps failing', async () => {
    const store = {
      query: vi.fn(async () => [{ values: [] as string[][] }]),
      commit: vi.fn(async () => { throw new Error('boom') }),
      manualRefresh: vi.fn(),
    }
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)
    const flushSpy = vi.spyOn(batchedMediaCommitter, 'flush')

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('add() hung')), 2000)
    )
    await expect(
      Promise.race([batchedMediaCommitter.add(makeMedia(2000)), timeout])
    ).rejects.toThrow(/boom/)

    expect(flushSpy.mock.calls.length).toBeLessThanOrEqual(2)
    expect(batchedMediaCommitter.getPendingCount()).toBeGreaterThan(0)
  })

  it('flush() rejects but re-queues the batch so a later flush retries it', async () => {
    const failing = {
      query: vi.fn(async () => [{ values: [] as string[][] }]),
      commit: vi.fn(async () => { throw new Error('boom') }),
      manualRefresh: vi.fn(),
    }
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(failing)

    await batchedMediaCommitter.add(makeMedia(10), { skipRefresh: true })
    await expect(batchedMediaCommitter.flush({ skipRefresh: true })).rejects.toThrow('boom')
    expect(batchedMediaCommitter.getPendingCount()).toBe(10)

    // Store recovers: the same batch commits on the next flush.
    const healthy = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(healthy)
    await batchedMediaCommitter.flush({ skipRefresh: true })
    expect(batchedMediaCommitter.getPendingCount()).toBe(0)
    expect(healthy.commit).toHaveBeenCalled()
  })
})

describe('BatchedMediaCommitter.flush', () => {
  beforeEach(() => { vi.restoreAllMocks(); batchedMediaCommitter.clear() })
  it('does not duplicate the buffer (swap, not spread)', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    await batchedMediaCommitter.add(makeMedia(100))
    const before = batchedMediaCommitter.getPendingCount()
    expect(before).toBeGreaterThan(0)
    const p = batchedMediaCommitter.flush()
    // After flush() starts, pendingMedia should be empty synchronously
    expect(batchedMediaCommitter.getPendingCount()).toBe(0)
    await p
  })

  it('chunks the existence SELECT into <=500 placeholders per call', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    for (let i = 0; i < 3; i++) {
      // @ts-expect-error test seam: directly push to private buffer
      batchedMediaCommitter.pendingMedia.push(...makeMedia(400))
    }
    expect(batchedMediaCommitter.getPendingCount()).toBe(1200)

    await batchedMediaCommitter.flush()

    const queries = (store.query.mock.calls as unknown as Array<[{ query: string }]>).map(
      ([{ query }]) => query,
    )
    expect(queries.length).toBeGreaterThanOrEqual(3)
    for (const q of queries) {
      const placeholders = (q.match(/\?/g) || []).length
      expect(placeholders).toBeLessThanOrEqual(500)
    }
  })

  it('routes the batch: new→bulkAdded, drifted→bulkUpdated, unchanged→dropped; binds positionally', async () => {
    const store = makeFakeStore()
    // The SELECT reports m0..m2 as already stored: m0/m1 identical, m2 drifted
    // (duration differs); m3/m4 are absent → new.
    const unchangedRow = (id: string) => ({
      id, type: 'audio', duration: null, discNumber: null,
      genresFlat: '', providersFlat: '', externalId: null, shareUrl: null, filePath: null,
    })
    store.query.mockImplementation(async () => [
      unchangedRow('m0'), unchangedRow('m1'), { ...unchangedRow('m2'), duration: 123 },
    ])
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)
    // @ts-expect-error test seam: directly push to private buffer
    batchedMediaCommitter.pendingMedia.push(...makeMedia(5))

    await batchedMediaCommitter.flush()

    // Object-form binds never reach positional placeholders and the old
    // decode read a nonexistent .values — both made this filter a no-op.
    const queryCalls = store.query.mock.calls as unknown as Array<[{ bindValues: unknown }]>
    expect(Array.isArray(queryCalls[0][0].bindValues)).toBe(true)
    expect(queryCalls[0][0].bindValues).toEqual(['m0', 'm1', 'm2', 'm3', 'm4'])

    const bulkEvents = (store.commit.mock.calls as unknown as Array<
      [unknown, { name: string; args: { media: Array<{ id: string; duration?: number }> } }]
    >)
      .map(([, event]) => event)
      .filter(e => e?.args?.media)
    expect(bulkEvents.map(e => e.name)).toEqual(['v1.MediaBulkAdded', 'v1.MediaBulkUpdated'])
    expect(bulkEvents[0].args.media.map(m => m.id)).toEqual(['m3', 'm4'])
    expect(bulkEvents[1].args.media.map(m => m.id)).toEqual(['m2'])
    expect(bulkEvents[1].args.media[0].duration).toBeUndefined()
  })
})

describe('BatchedMediaCommitter deferred refresh', () => {
  beforeEach(() => { vi.restoreAllMocks(); batchedMediaCommitter.clear() })

  it('default flush() calls manualRefresh once', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    await batchedMediaCommitter.add(makeMedia(100))
    await batchedMediaCommitter.flush()

    expect(store.manualRefresh).toHaveBeenCalledTimes(1)
  })

  it('flush({ skipRefresh: true }) never calls manualRefresh', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    await batchedMediaCommitter.add(makeMedia(100), { skipRefresh: true })
    await batchedMediaCommitter.flush({ skipRefresh: true })

    expect(store.manualRefresh).not.toHaveBeenCalled()
  })

  it('1200 deferred items produce exactly one refresh via explicit refresh()', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    // Three batches of 400 each, all deferred.
    await batchedMediaCommitter.add(makeMedia(400), { skipRefresh: true })
    await batchedMediaCommitter.flush({ skipRefresh: true })

    await batchedMediaCommitter.add(makeMedia(400), { skipRefresh: true })
    await batchedMediaCommitter.flush({ skipRefresh: true })

    await batchedMediaCommitter.add(makeMedia(400), { skipRefresh: true })
    await batchedMediaCommitter.flush({ skipRefresh: true })

    // No refresh calls during deferred path.
    expect(store.manualRefresh).not.toHaveBeenCalled()

    // One explicit refresh.
    await batchedMediaCommitter.refresh('test-1200')

    expect(store.manualRefresh).toHaveBeenCalledTimes(1)
    expect(store.manualRefresh).toHaveBeenCalledWith({ label: 'test-1200' })
  })

  it('second refresh() with no new deferred commits is a no-op', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    await batchedMediaCommitter.add(makeMedia(10), { skipRefresh: true })
    await batchedMediaCommitter.flush({ skipRefresh: true })

    await batchedMediaCommitter.refresh('first')
    expect(store.manualRefresh).toHaveBeenCalledTimes(1)

    // No new commits — second refresh should not call manualRefresh again.
    await batchedMediaCommitter.refresh('second-noop')
    expect(store.manualRefresh).toHaveBeenCalledTimes(1)
  })

  it('empty flush does not set refreshPending', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    // Flush with no items added — should not trigger a refresh.
    await batchedMediaCommitter.flush({ skipRefresh: true })
    await batchedMediaCommitter.refresh('empty')

    expect(store.manualRefresh).not.toHaveBeenCalled()
  })

  it('add with deferred options forces intermediate flushes to use skipRefresh too', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    // Add more than MAX_BATCH_SIZE in one call to force intermediate flushes.
    // The forced flushes should also be deferred.
    await batchedMediaCommitter.add(makeMedia(800), { skipRefresh: true })

    expect(store.manualRefresh).not.toHaveBeenCalled()

    // Final explicit refresh.
    await batchedMediaCommitter.refresh('large-batch')
    expect(store.manualRefresh).toHaveBeenCalledTimes(1)
  })
})
