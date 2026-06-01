import { test, expect } from '@playwright/test'

/**
 * OOM regression guard for "PlayAll on a large collection".
 *
 * History: PlayerContainer (always mounted) used to subscribe to the entire
 * queue via useMediaMapForIds. After PlayAll on a 10k-track library that
 * meant a reactive SELECT * FROM media WHERE id IN (10k) materialized into
 * JS on every sync write, OOM'ing the tab.
 *
 * Fix: PlayerContainer now subscribes to the single current track via
 * useMediaById. Queue.tsx drops its mediaMap prop and lets MusicTable's
 * slow path fetch per visible row.
 *
 * This spec seeds a large library, queues it all, plays the first track,
 * and asserts the JS heap stays under a budget.
 */

const SEED_COUNT = 10_000
const HEAP_BUDGET_MB = 250

async function waitForLiveStore(page: any) {
  await page.waitForFunction(
    () => (window as any).__liveStore != null,
    { timeout: 30_000 },
  )
  await page.waitForTimeout(500)
}

async function seedMedia(page: any, count: number) {
  await page.evaluate(async (count: number) => {
    const store = (window as any).__liveStore
    if (!store) throw new Error('LiveStore not available')
    const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

    const BATCH = 500
    for (let batch = 0; batch < Math.ceil(count / BATCH); batch++) {
      const media: unknown[] = []
      for (let i = 0; i < BATCH && (batch * BATCH + i) < count; i++) {
        const idx = batch * BATCH + i
        media.push({
          id: `oom-media-${idx}`,
          title: `Song ${idx}`,
          artist: { id: `oom-artist-${idx % 200}`, name: `Artist ${idx % 200}` },
          album: {
            id: `oom-album-${idx % 1000}`,
            name: `Album ${idx % 1000}`,
            artistId: `oom-artist-${idx % 200}`,
          },
          type: 'audio',
          duration: 180000 + (idx % 300) * 1000,
          track: (idx % 12) + 1,
          stream: { dummy: { url: `http://localhost/stream/${idx}.mp3`, quality: 'high' } },
          genres: [`genre-${idx % 20}`],
        })
      }
      await store.commit({ skipRefresh: true }, mediaEvents.mediaBulkAdded({ media }))
    }
    store.manualRefresh({ label: 'oom-seed' })
  }, count)
}

async function jsHeapMb(page: any): Promise<number> {
  const session = await page.context().newCDPSession(page)
  await session.send('HeapProfiler.collectGarbage')
  const { result } = await session.send('Runtime.evaluate', {
    expression: '(performance as any).memory?.usedJSHeapSize ?? 0',
    returnByValue: true,
  })
  await session.detach()
  return Math.round((result.value as number) / (1024 * 1024))
}

test.describe('OOM regression: PlayAll on large library', () => {
  test.describe.configure({ timeout: 180_000 })

  test('heap stays under budget after PlayAll on 10k tracks', async ({ page }) => {
    const captureWarnings: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'warning') captureWarnings.push(msg.text())
    })

    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, SEED_COUNT)
    await page.waitForTimeout(2000)

    const heapAfterSeed = await jsHeapMb(page)

    // Queue the whole library and start playback.
    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { queueEvents } = await import('/src/stores/livestore/events/queue.ts')
      const trackIds = Array.from({ length: 10_000 }, (_, i) => `oom-media-${i}`)
      await store.commit(
        queueEvents.queueUpdated({
          id: 'default',
          trackIds,
          currentPlaying: 0,
          shuffle: false,
          repeat: false,
        }),
      )
      store.manualRefresh({ label: 'oom-playall' })
    })

    // Settle: let the app react, then GC.
    await page.waitForTimeout(3000)
    const heapAfterPlayAll = await jsHeapMb(page)

    // eslint-disable-next-line no-console
    console.log(
      `[oom] heap after seed: ${heapAfterSeed} MB, after PlayAll: ${heapAfterPlayAll} MB`,
    )

    // Regression guard: PlayAll must not balloon the heap.
    expect(heapAfterPlayAll).toBeLessThan(HEAP_BUDGET_MB)

    // Soft cap on useMediaMapForIds should NOT have fired: nothing in the
    // PlayAll path is allowed to subscribe to the whole queue.
    const overcap = captureWarnings.filter((w) => w.includes('useMediaMapForIds'))
    expect(overcap, `unexpected map-for-ids subscription: ${overcap.join(' | ')}`).toEqual([])
  })
})
