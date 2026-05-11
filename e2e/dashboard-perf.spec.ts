import { test, expect } from '@playwright/test'

/**
 * Focused test: measure what happens on the Dashboard route
 * which is loaded on every page reload.
 *
 * With 4K items, multiple hooks fire on every media table change:
 * - SidebarContents: useMediaCount, useArtistsCount, useSearchMediaIds
 * - CommandBar: useSearchMediaIds, useMediaMapForIds
 * - Dashboard: useRecentlyPlayed, useMediaCount, useMostPlayed, useGenres, etc.
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
          id: `dash-media-${idx}`,
          title: `Song ${idx}`,
          artist: { id: `dash-artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: { id: `dash-album-${idx % 500}`, name: `Album ${idx % 500}`, artistId: `dash-artist-${idx % 100}` },
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

test.describe('Dashboard Performance', () => {
  test.describe.configure({ timeout: 90_000 })

  test('count active reactive queries on dashboard with 4K items', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)

    // Wait for dashboard to settle
    await page.waitForTimeout(2000)

    // Measure: commit a single trivial media update and count how many
    // re-renders / long tasks it triggers
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

      // Single mediaPlayed — should be trivial but may cascade
      await store.commit(mediaEvents.mediaPlayed({ id: 'dash-media-0' }))

      // Wait for all reactive cascades to settle
      await new Promise(r => setTimeout(r, 1000))
      observer.disconnect()

      return { longTasks, totalBlockingTime: Math.round(totalBlockingTime) }
    })

    console.log(`\n=== SINGLE mediaPlayed ON DASHBOARD (4K items) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)

    // A single mediaPlayed on the dashboard should cause minimal jank
    expect(results.longTasks, 'Long tasks from one mediaPlayed').toBeLessThan(5)
  })

  test('measure continuous FPS on dashboard with 4K items', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await page.waitForTimeout(2000)

    // Measure FPS for 3 seconds while idle (no interaction)
    const fps = await page.evaluate(async () => {
      return new Promise<{ avgFps: number; minFps: number; frameTimes: number[] }>((resolve) => {
        const frameTimes: number[] = []
        let lastTime = performance.now()
        let frames = 0
        const duration = 3000

        const measure = (now: number) => {
          const delta = now - lastTime
          frameTimes.push(delta)
          lastTime = now
          frames++

          if (now - frameTimes[0] < duration) {
            requestAnimationFrame(measure)
          } else {
            // Calculate FPS
            const avgDelta = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
            const avgFps = Math.round(1000 / avgDelta)
            const maxDelta = Math.max(...frameTimes)
            const minFps = Math.round(1000 / maxDelta)
            resolve({ avgFps, minFps, frameTimes: frameTimes.map(Math.round) })
          }
        }
        requestAnimationFrame(measure)
      })
    })

    console.log(`\n=== IDLE FPS ON DASHBOARD (4K items) ===`)
    console.log(`Average FPS: ${fps.avgFps}`)
    console.log(`Min FPS: ${fps.minFps}`)

    expect(fps.avgFps, 'Average FPS should be above 50').toBeGreaterThan(50)
    expect(fps.minFps, 'Min FPS should be above 20').toBeGreaterThan(20)
  })

  test('measure FPS during rapid mediaPlayed events', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await page.waitForTimeout(2000)

    const results = await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')

      let frameDips = 0
      let maxGap = 0
      let lastFrame = performance.now()
      let measuring = true

      const checkFrame = (now: number) => {
        const delta = now - lastFrame
        if (delta > 33) frameDips++ // Below 30fps
        if (delta > maxGap) maxGap = delta
        lastFrame = now
        if (measuring) requestAnimationFrame(checkFrame)
      }
      requestAnimationFrame(checkFrame)

      // Rapid-fire 20 mediaPlayed events (simulates fast track skipping)
      for (let i = 0; i < 20; i++) {
        await store.commit(mediaEvents.mediaPlayed({ id: `dash-media-${i}` }))
        await new Promise(r => setTimeout(r, 50))
      }

      await new Promise(r => setTimeout(r, 1000))
      measuring = false

      return { frameDips, maxGap: Math.round(maxGap) }
    })

    console.log(`\n=== RAPID mediaPlayed x20 (4K items) ===`)
    console.log(`Frame dips below 30fps: ${results.frameDips}`)
    console.log(`Max frame gap: ${results.maxGap}ms`)

    // This documents the current regression — will tighten after fix
    expect(results.maxGap, 'Max frame gap').toBeLessThan(500)
  })
})
