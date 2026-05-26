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
})
