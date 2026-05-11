import { test, expect } from '@playwright/test'

/**
 * Measures bootstrap performance when the app reloads with data already
 * persisted in LiveStore's SQLite. This is the "open app with 5K songs"
 * experience — all reactive queries fire simultaneously during hydration.
 */

async function waitForLiveStore(page: any) {
  await page.waitForFunction(
    () => (window as any).__liveStore != null,
    { timeout: 30_000 }
  )
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
          id: `boot-media-${idx}`,
          title: `Song ${idx}`,
          artist: { id: `boot-artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: { id: `boot-album-${idx % 500}`, name: `Album ${idx % 500}`, artistId: `boot-artist-${idx % 100}` },
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

test.describe('Bootstrap Performance (pre-filled data)', () => {
  test.describe.configure({ timeout: 120_000 })

  test('measure reload with 5K items already in LiveStore', async ({ page }) => {
    // Phase 1: Seed the database
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(1000)

    // Phase 2: Reload — this simulates "open app with existing library"
    // The data is persisted in LiveStore's SQLite (OPFS/IndexedDB)
    const reloadStart = Date.now()

    await page.reload()

    // Wait for LiveStore to be available (hydration complete)
    await waitForLiveStore(page)
    const liveStoreReady = Date.now() - reloadStart

    // Wait for the UI to be interactive (React rendered)
    await page.waitForFunction(
      () => document.querySelectorAll('a[href="/collection"]').length > 0,
      { timeout: 30_000 }
    )
    const uiReady = Date.now() - reloadStart

    // Measure long tasks during the bootstrap window
    const metrics = await page.evaluate(async () => {
      // Start monitoring from NOW (post-hydration)
      let longTasks = 0
      let totalBlockingTime = 0
      let maxTaskDuration = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks++
          totalBlockingTime += entry.duration - 50
          if (entry.duration > maxTaskDuration) maxTaskDuration = entry.duration
        }
      })
      observer.observe({ type: 'longtask', buffered: true })

      // Wait for all reactive cascades to settle
      await new Promise(r => setTimeout(r, 3000))
      observer.disconnect()

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
        maxTaskDuration: Math.round(maxTaskDuration),
      }
    })

    console.log(`\n=== BOOTSTRAP WITH 5K ITEMS ===`)
    console.log(`LiveStore ready: ${liveStoreReady}ms`)
    console.log(`UI interactive: ${uiReady}ms`)
    console.log(`Long tasks (buffered): ${metrics.longTasks}`)
    console.log(`Total blocking time: ${metrics.totalBlockingTime}ms`)
    console.log(`Max single task: ${metrics.maxTaskDuration}ms`)

    expect(uiReady, 'Time to UI interactive').toBeLessThan(15000)
  })

  test('measure navigation to collection after reload with 5K items', async ({ page }) => {
    // Seed and reload
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(1000)

    await page.reload()
    await waitForLiveStore(page)
    await page.waitForTimeout(2000) // Let initial hydration settle

    // Navigate to collection and measure
    const navStart = Date.now()

    await page.locator('a[href="/collection"]').last().click({ force: true })
    await page.waitForURL('**/collection')

    // Wait for the virtualized list to render rows
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="song-row"]').length > 0,
      { timeout: 15_000 }
    )
    const collectionReady = Date.now() - navStart

    // Measure settling cost
    const metrics = await page.evaluate(async () => {
      let longTasks = 0
      let totalBlockingTime = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          longTasks++
          totalBlockingTime += entry.duration - 50
        }
      })
      observer.observe({ type: 'longtask', buffered: false })
      await new Promise(r => setTimeout(r, 2000))
      observer.disconnect()
      return { longTasks, totalBlockingTime: Math.round(totalBlockingTime) }
    })

    console.log(`\n=== NAVIGATE TO COLLECTION AFTER RELOAD (5K items) ===`)
    console.log(`Collection ready (rows visible): ${collectionReady}ms`)
    console.log(`Settling long tasks: ${metrics.longTasks}`)
    console.log(`Settling blocking time: ${metrics.totalBlockingTime}ms`)

    expect(collectionReady, 'Collection render after reload').toBeLessThan(8000)
  })

  test('measure FPS during first 5 seconds after reload with 5K items', async ({ page }) => {
    // Seed and reload
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(1000)

    await page.reload()
    await waitForLiveStore(page)

    // Immediately start measuring FPS for 5 seconds
    const fps = await page.evaluate(async () => {
      return new Promise<{ avgFps: number; minFps: number; droppedFrames: number }>((resolve) => {
        const frameTimes: number[] = []
        let lastTime = performance.now()
        let droppedFrames = 0
        const duration = 5000

        const startTime = performance.now()

        const measure = (now: number) => {
          const delta = now - lastTime
          frameTimes.push(delta)
          if (delta > 33) droppedFrames++ // Below 30fps
          lastTime = now

          if (now - startTime < duration) {
            requestAnimationFrame(measure)
          } else {
            const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
            const avgFps = Math.round(1000 / avgDelta)
            const maxDelta = Math.max(...frameTimes)
            const minFps = Math.round(1000 / maxDelta)
            resolve({ avgFps, minFps, droppedFrames })
          }
        }
        requestAnimationFrame(measure)
      })
    })

    console.log(`\n=== FPS DURING FIRST 5s AFTER RELOAD (5K items) ===`)
    console.log(`Average FPS: ${fps.avgFps}`)
    console.log(`Min FPS: ${fps.minFps}`)
    console.log(`Dropped frames (below 30fps): ${fps.droppedFrames}`)

    // Document current state — will tighten after optimization
    expect(fps.avgFps, 'Average FPS during bootstrap').toBeGreaterThan(10)
  })

  test('measure total page load metrics with Performance API', async ({ page }) => {
    // Seed first
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(1000)

    // Reload and collect all performance entries
    await page.reload()
    await waitForLiveStore(page)
    await page.waitForTimeout(5000) // Let everything settle

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const longTasks = performance.getEntriesByType('longtask')
      const paints = performance.getEntriesByType('paint')

      const fcp = paints.find(p => p.name === 'first-contentful-paint')

      return {
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        loadEvent: Math.round(nav.loadEventEnd - nav.startTime),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        longTaskCount: longTasks.length,
        totalLongTaskTime: Math.round(longTasks.reduce((acc, t) => acc + t.duration, 0)),
        maxLongTask: Math.round(Math.max(...longTasks.map(t => t.duration), 0)),
      }
    })

    console.log(`\n=== PAGE LOAD METRICS (5K items, reload) ===`)
    console.log(`DOM Content Loaded: ${perfData.domContentLoaded}ms`)
    console.log(`Load Event: ${perfData.loadEvent}ms`)
    console.log(`First Contentful Paint: ${perfData.fcp}ms`)
    console.log(`Long tasks during load: ${perfData.longTaskCount}`)
    console.log(`Total long task time: ${perfData.totalLongTaskTime}ms`)
    console.log(`Max single long task: ${perfData.maxLongTask}ms`)
  })
})
