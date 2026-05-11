import { test, expect } from '@playwright/test'

/**
 * Measures the cost of phantom media-table subscriptions.
 *
 * Current state: useSearchMediaIds fires 2x `WHERE id = '__NONE__'` queries
 * that register media-table dependencies even when idle. Every media write
 * then invalidates those cached queries, triggering re-execution + re-render.
 *
 * This test quantifies that overhead by:
 * 1. Seeding 4K items (triggers media table writes)
 * 2. Measuring long tasks during a single media write on the dashboard
 *    (where SidebarContents + CommandBar are always mounted)
 */

async function waitForLiveStore(page: any) {
  await page.waitForFunction(
    () => (window as any).__liveStore != null,
    { timeout: 15_000 }
  )
  await page.waitForTimeout(500)
}

async function seedMedia(page: any, count: number) {
  await page.evaluate(async (count: number) => {
    const store = (window as any).__liveStore
    if (!store) throw new Error('LiveStore not available')
    const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

    const BATCH = 200
    for (let batch = 0; batch < Math.ceil(count / BATCH); batch++) {
      const media = []
      for (let i = 0; i < BATCH && (batch * BATCH + i) < count; i++) {
        const idx = batch * BATCH + i
        media.push({
          id: `sub-media-${idx}`,
          title: `Song ${idx}`,
          artist: { id: `sub-artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: { id: `sub-album-${idx % 500}`, name: `Album ${idx % 500}`, artistId: `sub-artist-${idx % 100}` },
          type: 'audio',
          duration: 180000 + (idx % 300) * 1000,
          track: (idx % 12) + 1,
          stream: { dummy: { url: `http://localhost/stream/${idx}.mp3`, quality: 'high' } },
          genres: [`genre-${idx % 20}`],
        })
      }
      await store.commit({ skipRefresh: true }, mediaEvents.mediaBulkAdded({ media }))
    }
    store.manualRefresh({ label: 'e2e-seed' })
  }, count)
}

test.describe('Subscription Overhead', () => {
  test.describe.configure({ timeout: 90_000 })

  test('measure cost of a single media write with all layout hooks active', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await page.waitForTimeout(2000)

    // We're on the dashboard. SidebarContents is mounted with:
    // - useMediaCount() -> 1 media table subscription
    // - useArtistsCount() -> 1 artists table subscription
    // - useSearchMediaIds('', 1000) -> 2 __NONE__ media table subscriptions
    // CommandBar also has:
    // - useSearchMediaIds('', 50) -> 2 more __NONE__ media table subscriptions

    // Measure: commit a MediaUpdated event (simulates metadata correction)
    const results = await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      let longTasks = 0
      let totalBlockingTime = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks++
          totalBlockingTime += entry.duration - 50
        }
      })
      observer.observe({ type: 'longtask', buffered: false })

      const start = performance.now()

      // Single metadata update — should be cheap but cascades to all subscriptions
      await store.commit(mediaEvents.mediaUpdated({
        id: 'sub-media-0',
        title: 'Updated Song 0',
      }))

      // Wait for reactive cascades
      await new Promise(r => setTimeout(r, 1000))
      observer.disconnect()

      const elapsed = performance.now() - start

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
        totalElapsed: Math.round(elapsed),
      }
    })

    console.log(`\n=== SINGLE mediaUpdated ON DASHBOARD (4K items, all layout hooks active) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)
    console.log(`Total elapsed: ${results.totalElapsed}ms`)

    // Baseline measurement — we'll tighten after the fix
    expect(results.longTasks, 'Long tasks from one mediaUpdated').toBeLessThan(5)
  })

  test('measure cost of bulk media write with all layout hooks active', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await page.waitForTimeout(2000)

    // Simulate a background sync adding 50 new items (periodic sync scenario)
    const results = await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      let longTasks = 0
      let totalBlockingTime = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks++
          totalBlockingTime += entry.duration - 50
        }
      })
      observer.observe({ type: 'longtask', buffered: false })

      const start = performance.now()

      // Add 50 new items with skipRefresh + manualRefresh (the optimized path)
      const media = Array.from({ length: 50 }, (_, i) => ({
        id: `sync-new-${i}`,
        title: `New Sync Song ${i}`,
        artist: { id: `sync-artist-${i % 10}`, name: `Sync Artist ${i % 10}` },
        album: { id: `sync-album-${i % 20}`, name: `Sync Album ${i % 20}`, artistId: `sync-artist-${i % 10}` },
        type: 'audio',
        duration: 200000,
        stream: { dummy: { url: `http://localhost/sync/${i}.mp3`, quality: 'high' } },
        genres: ['sync-genre'],
      }))

      await store.commit({ skipRefresh: true }, mediaEvents.mediaBulkAdded({ media }))
      store.manualRefresh({ label: 'e2e-bulk-sync' })

      await new Promise(r => setTimeout(r, 1500))
      observer.disconnect()

      const elapsed = performance.now() - start

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
        totalElapsed: Math.round(elapsed),
      }
    })

    console.log(`\n=== BULK SYNC +50 items ON DASHBOARD (4K existing, all layout hooks active) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)
    console.log(`Total elapsed: ${results.totalElapsed}ms`)

    expect(results.longTasks, 'Long tasks from bulk sync').toBeLessThan(10)
  })
})
