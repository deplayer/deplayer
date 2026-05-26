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
  query: vi.fn(async () => [{ values: [] as string[][] }]),
  commit: vi.fn(async () => undefined),
  manualRefresh: vi.fn(),
})

describe('BatchedMediaCommitter.add', () => {
  beforeEach(() => batchedMediaCommitter.clear())

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
    ).rejects.toThrow(/did not drain/)

    expect(flushSpy.mock.calls.length).toBeLessThanOrEqual(8)
    // Drained input that made it in is still pending; the unbuffered tail
    // is surfaced via the thrown error rather than silently dropped.
    expect(batchedMediaCommitter.getPendingCount()).toBeGreaterThan(0)
  })
})

describe('BatchedMediaCommitter.flush', () => {
  beforeEach(() => batchedMediaCommitter.clear())

  it('does not duplicate the buffer (swap, not spread)', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    await batchedMediaCommitter.add(makeMedia(100))
    const before = batchedMediaCommitter.getPendingCount()
    expect(before).toBeGreaterThan(0)
    const p = batchedMediaCommitter.flush()
    // After flush() starts, pendingMedia should be empty synchronously
    // (the swap happens before any await). If we spread, pendingMedia would
    // still contain the original 100 entries here.
    expect(batchedMediaCommitter.getPendingCount()).toBe(0)
    await p
  })

  it('chunks the existence SELECT into <=500 placeholders per call', async () => {
    const store = makeFakeStore()
    // @ts-expect-error test seam
    batchedMediaCommitter.setStore(store)

    // Bypass add() bounds: write directly to the internal buffer so we can
    // exercise the flush()-side chunking with a >500 buffer.
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
})
