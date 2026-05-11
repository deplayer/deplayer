import { test, expect } from '@playwright/test'

/**
 * Measures subscription overhead on the Collection route
 * where useCollectionData (full 4K select) is active alongside
 * sidebar/commandbar phantom subscriptions.
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
          id: `col-media-${idx}`,
          title: `Song ${idx}`,
          artist: { id: `col-artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: { id: `col-album-${idx % 500}`, name: `Album ${idx % 500}`, artistId: `col-artist-${idx % 100}` },
          type: 'audio',
          duration: 180000,
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

async function navigateToCollection(page: any) {
  await page.locator('a[href="/collection"]').last().click({ force: true })
  await page.waitForURL('**/collection')
  await page.waitForTimeout(1500)
}

test.describe('Subscription Overhead - Collection Route', () => {
  test.describe.configure({ timeout: 90_000 })

  test('single mediaUpdated on collection page (4K items)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

    // On /collection: useCollectionData (SELECT 13 cols FROM media ORDER BY title)
    // + SidebarContents: useMediaCount + 2x __NONE__ from useSearchMediaIds
    // + CommandBar: 2x __NONE__ from useSearchMediaIds

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

      await store.commit(mediaEvents.mediaUpdated({
        id: 'col-media-0',
        title: 'Updated Song 0',
      }))

      await new Promise(r => setTimeout(r, 1500))
      observer.disconnect()

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
        totalElapsed: Math.round(performance.now() - start),
      }
    })

    console.log(`\n=== SINGLE mediaUpdated ON COLLECTION (4K items) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)
    console.log(`Total elapsed: ${results.totalElapsed}ms`)

    expect(results.longTasks, 'Long tasks from one mediaUpdated on collection').toBeLessThan(5)
  })

  test('bulk sync +50 on collection page (4K items)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

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

      const media = Array.from({ length: 50 }, (_, i) => ({
        id: `sync-col-${i}`,
        title: `Sync Song ${i}`,
        artist: { id: `sync-artist-${i % 10}`, name: `Sync Artist ${i % 10}` },
        album: { id: `sync-album-${i % 20}`, name: `Sync Album ${i % 20}`, artistId: `sync-artist-${i % 10}` },
        type: 'audio',
        duration: 200000,
        stream: { dummy: { url: `http://localhost/sync/${i}.mp3`, quality: 'high' } },
        genres: ['sync-genre'],
      }))

      const start = performance.now()
      await store.commit({ skipRefresh: true }, mediaEvents.mediaBulkAdded({ media }))
      store.manualRefresh({ label: 'e2e-bulk-sync' })

      await new Promise(r => setTimeout(r, 1500))
      observer.disconnect()

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
        totalElapsed: Math.round(performance.now() - start),
      }
    })

    console.log(`\n=== BULK SYNC +50 ON COLLECTION (4K items) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)
    console.log(`Total elapsed: ${results.totalElapsed}ms`)

    expect(results.longTasks, 'Long tasks from bulk sync on collection').toBeLessThan(10)
  })

  test('rapid mediaUpdated x5 on collection simulating metadata corrections', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

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

      // 5 rapid metadata corrections (e.g., provider returns updated info)
      for (let i = 0; i < 5; i++) {
        await store.commit(mediaEvents.mediaUpdated({
          id: `col-media-${i}`,
          title: `Corrected Song ${i}`,
        }))
        await new Promise(r => setTimeout(r, 50))
      }

      await new Promise(r => setTimeout(r, 1500))
      observer.disconnect()

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
      }
    })

    console.log(`\n=== RAPID mediaUpdated x5 ON COLLECTION (4K items) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)

    expect(results.longTasks, 'Long tasks from 5 rapid updates on collection').toBeLessThan(10)
  })
})
