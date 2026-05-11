import { test, expect } from '@playwright/test'

/**
 * Performance regression tests for deplayer.
 *
 * These tests seed LiveStore with realistic data volumes and measure
 * long tasks, blocking time, and frame drops during common operations.
 *
 * Run: npm run test:e2e
 *
 * To debug visually: npx playwright test e2e/performance-regression.spec.ts --headed
 */

// --- Helpers ---

async function waitForLiveStore(page: any) {
  await page.waitForFunction(
    () => (window as any).__liveStore != null,
    { timeout: 15_000 }
  )
  await page.waitForTimeout(500)
}

async function navigateToCollection(page: any) {
  await page.locator('a[href="/collection"]').last().click({ force: true })
  await page.waitForURL('**/collection')
  await page.waitForTimeout(1500)
}

async function seedMedia(page: any, count: number, prefix = 'perf') {
  return page.evaluate(async ({ count, prefix }: { count: number; prefix: string }) => {
    const store = (window as any).__liveStore
    if (!store) throw new Error('LiveStore not available')

    const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

    const BATCH = 200
    for (let batch = 0; batch < Math.ceil(count / BATCH); batch++) {
      const media = []
      for (let i = 0; i < BATCH && (batch * BATCH + i) < count; i++) {
        const idx = batch * BATCH + i
        media.push({
          id: `${prefix}-media-${idx}`,
          title: `Song ${idx}`,
          artist: { id: `${prefix}-artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: {
            id: `${prefix}-album-${idx % 500}`,
            name: `Album ${idx % 500}`,
            artistId: `${prefix}-artist-${idx % 100}`,
          },
          type: 'audio',
          duration: 180000 + (idx % 300) * 1000,
          track: (idx % 12) + 1,
          stream: { dummy: { url: `http://localhost/stream/${idx}.mp3`, quality: 'high' } },
          genres: [`genre-${idx % 20}`],
        })
      }
      await store.commit(
        { skipRefresh: true },
        mediaEvents.mediaBulkAdded({ media })
      )
    }
    store.manualRefresh({ label: 'e2e-seed' })
  }, { count, prefix })
}

interface PerfMetrics {
  longTasks: number
  totalBlockingTime: number
  frameDips: number
  maxFrameGap: number
}

/**
 * Start performance monitoring inside the page.
 * Returns a handle that can be stopped later to collect metrics.
 */
async function startPerfMonitor(page: any): Promise<void> {
  await page.evaluate(() => {
    const w = window as any
    w.__perfLongTasks = 0
    w.__perfTotalBlocking = 0
    w.__perfFrameDips = 0
    w.__perfMaxFrameGap = 0
    w.__perfMeasuring = true

    w.__perfObserver = new PerformanceObserver((list: PerformanceObserverEntryList) => {
      for (const entry of list.getEntries()) {
        w.__perfLongTasks++
        w.__perfTotalBlocking += entry.duration - 50
      }
    })
    w.__perfObserver.observe({ type: 'longtask', buffered: false })

    let lastFrame = performance.now()
    const check = (now: number) => {
      const delta = now - lastFrame
      if (delta > 50) w.__perfFrameDips++
      if (delta > w.__perfMaxFrameGap) w.__perfMaxFrameGap = delta
      lastFrame = now
      if (w.__perfMeasuring) requestAnimationFrame(check)
    }
    requestAnimationFrame(check)
  })
}

async function stopPerfMonitor(page: any): Promise<PerfMetrics> {
  return page.evaluate(() => {
    const w = window as any
    w.__perfMeasuring = false
    w.__perfObserver?.disconnect()
    return {
      longTasks: w.__perfLongTasks,
      totalBlockingTime: Math.round(w.__perfTotalBlocking),
      frameDips: w.__perfFrameDips,
      maxFrameGap: Math.round(w.__perfMaxFrameGap),
    }
  })
}

function logMetrics(label: string, metrics: PerfMetrics) {
  console.log(`\n=== ${label} ===`)
  console.log(`Long tasks (>50ms): ${metrics.longTasks}`)
  console.log(`Total blocking time: ${metrics.totalBlockingTime}ms`)
  console.log(`Frame dips (>50ms gap): ${metrics.frameDips}`)
  console.log(`Max frame gap: ${metrics.maxFrameGap}ms`)
}

// --- Tests ---

test.describe('Performance Regression Suite', () => {
  test.describe.configure({ timeout: 90_000 })

  test('background sync should not block UI with 4K items in collection', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

    await startPerfMonitor(page)

    // Simulate what BatchedMediaCommitter does: skipRefresh chunks + final manualRefresh
    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      const BATCHES = 5
      const BATCH_SIZE = 50

      for (let b = 0; b < BATCHES; b++) {
        const media = Array.from({ length: BATCH_SIZE }, (_, i) => {
          const idx = 10000 + b * BATCH_SIZE + i
          return {
            id: `sync-${idx}`,
            title: `Sync Song ${idx}`,
            artist: { id: `sync-artist-${idx % 30}`, name: `Sync Artist ${idx % 30}` },
            album: { id: `sync-album-${idx % 60}`, name: `Sync Album ${idx % 60}`, artistId: `sync-artist-${idx % 30}` },
            type: 'audio',
            duration: 200000,
            stream: { dummy: { url: `http://localhost/sync/${idx}.mp3`, quality: 'high' } },
            genres: ['sync-genre'],
          }
        })

        await store.commit(
          { skipRefresh: true },
          mediaEvents.mediaBulkAdded({ media })
        )
        await new Promise(r => requestAnimationFrame(() => r(undefined)))
      }

      // Single refresh at the end (the fix we applied)
      store.manualRefresh({ label: 'e2e-sync' })
    })

    await page.waitForTimeout(2000)
    const metrics = await stopPerfMonitor(page)
    logMetrics('BACKGROUND SYNC (4K + 250 new, skipRefresh path)', metrics)

    expect(metrics.longTasks, 'Long tasks during sync').toBeLessThan(15)
    expect(metrics.totalBlockingTime, 'Total blocking time').toBeLessThan(1500)
    expect(metrics.maxFrameGap, 'Max frame gap').toBeLessThan(500)
  })

  test('background sync WITHOUT skipRefresh causes more jank (regression baseline)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

    await startPerfMonitor(page)

    // Simulate the BAD path: each batch commits without skipRefresh
    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      const BATCHES = 5
      const BATCH_SIZE = 50

      for (let b = 0; b < BATCHES; b++) {
        const media = Array.from({ length: BATCH_SIZE }, (_, i) => {
          const idx = 20000 + b * BATCH_SIZE + i
          return {
            id: `nosync-${idx}`,
            title: `NoSync Song ${idx}`,
            artist: { id: `nosync-artist-${idx % 30}`, name: `NoSync Artist ${idx % 30}` },
            album: { id: `nosync-album-${idx % 60}`, name: `NoSync Album ${idx % 60}`, artistId: `nosync-artist-${idx % 30}` },
            type: 'audio',
            duration: 200000,
            stream: { dummy: { url: `http://localhost/nosync/${idx}.mp3`, quality: 'high' } },
            genres: ['nosync-genre'],
          }
        })

        // NO skipRefresh — each commit triggers full reactive cascade
        await store.commit(mediaEvents.mediaBulkAdded({ media }))
        await new Promise(r => requestAnimationFrame(() => r(undefined)))
      }
    })

    await page.waitForTimeout(2000)
    const metrics = await stopPerfMonitor(page)
    logMetrics('BACKGROUND SYNC WITHOUT skipRefresh (regression baseline)', metrics)

    // This test documents the regression — it SHOULD be worse than the skipRefresh path
    // We don't assert failure, we just log for comparison
  })

  test('mediaPlayed should not cause long tasks (500 items)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 500, 'played')
    await navigateToCollection(page)

    await startPerfMonitor(page)

    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      for (let i = 0; i < 10; i++) {
        await store.commit(mediaEvents.mediaPlayed({ id: `played-media-${i}` }))
        await new Promise(r => setTimeout(r, 200))
      }
    })

    await page.waitForTimeout(500)
    const metrics = await stopPerfMonitor(page)
    logMetrics('MEDIA PLAYED x10 (500 items)', metrics)

    expect(metrics.longTasks, 'Long tasks during playback tracking').toBeLessThan(5)
    expect(metrics.totalBlockingTime, 'Total blocking time').toBeLessThan(500)
  })

  test('mediaPlayed should not cause long tasks (4K items)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

    await startPerfMonitor(page)

    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      for (let i = 0; i < 10; i++) {
        await store.commit(mediaEvents.mediaPlayed({ id: `perf-media-${i}` }))
        await new Promise(r => setTimeout(r, 200))
      }
    })

    await page.waitForTimeout(500)
    const metrics = await stopPerfMonitor(page)
    logMetrics('MEDIA PLAYED x10 (4K items)', metrics)

    expect(metrics.longTasks, 'Long tasks during playback tracking').toBeLessThan(3)
    expect(metrics.totalBlockingTime, 'Total blocking time').toBeLessThan(200)
  })

  test('collection initial render with 4K items', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)

    const start = Date.now()
    await navigateToCollection(page)
    const renderTime = Date.now() - start

    await page.screenshot({ path: '/tmp/deplayer-collection-4k.png' })

    console.log(`\n=== COLLECTION RENDER ===`)
    console.log(`4K items initial render: ${renderTime}ms`)

    expect(renderTime, 'Collection render time').toBeLessThan(5000)
  })

  test('scroll performance during queue position changes (4K items)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await navigateToCollection(page)

    // Set up queue before measuring (this is an expensive one-time operation)
    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { queueEvents } = await import('/src/stores/livestore/events/queue.ts')
      await store.commit(queueEvents.queueUpdated({
        id: 'default',
        trackIds: Array.from({ length: 4000 }, (_, i) => `perf-media-${i}`),
        currentPlaying: 0,
        shuffle: false,
        repeat: false,
      }))
    })
    await page.waitForTimeout(1000)

    await startPerfMonitor(page)

    // Simulate rapid queue position changes (as if songs are advancing)
    await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { queueEvents } = await import('/src/stores/livestore/events/queue.ts')

      for (let i = 1; i <= 10; i++) {
        await store.commit(queueEvents.queuePositionChanged({
          queueId: 'default',
          position: i,
        }))
        await new Promise(r => setTimeout(r, 100))
      }
    })

    // Simulate scrolling by triggering the virtualized list
    const list = page.locator('.music-table .ReactVirtualized__List')
    if (await list.count() > 0) {
      await list.evaluate((el) => {
        for (let i = 0; i < 5; i++) {
          el.scrollTop += 500
          el.dispatchEvent(new Event('scroll'))
        }
      })
    }

    await page.waitForTimeout(1000)
    const metrics = await stopPerfMonitor(page)
    logMetrics('SCROLL + QUEUE CHANGES (4K items)', metrics)

    expect(metrics.longTasks, 'Long tasks during scroll + playback').toBeLessThan(5)
    expect(metrics.maxFrameGap, 'Max frame gap during scroll').toBeLessThan(300)
  })
})
