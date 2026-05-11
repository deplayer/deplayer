import { test, expect } from '@playwright/test'

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
          id: `scroll-media-${idx}`,
          title: `Song ${String(idx).padStart(5, '0')}`,
          artist: { id: `scroll-artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: { id: `scroll-album-${idx % 500}`, name: `Album ${idx % 500}`, artistId: `scroll-artist-${idx % 100}` },
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

test.describe('Scroll Performance - Collection', () => {
  test.describe.configure({ timeout: 120_000 })

  test('FPS during continuous scroll with 5K items', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(2000)

    // Navigate to collection
    await page.locator('a[href="/collection"]').last().click({ force: true })
    await page.waitForURL('**/collection')
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="song-row"]').length > 0,
      { timeout: 15_000 }
    )
    await page.waitForTimeout(1000)

    // Measure FPS during programmatic scroll
    const results = await page.evaluate(async () => {
      const list = document.querySelector('.music-table .ReactVirtualized__List')
      if (!list) return { error: 'List not found', avgFps: 0, minFps: 0, droppedFrames: 0, totalFrames: 0, rowsVisible: 0 }

      const rowsVisible = document.querySelectorAll('[data-testid="song-row"]').length

      const frameTimes: number[] = []
      let lastTime = performance.now()
      let droppedFrames = 0
      let measuring = true

      const measure = (now: number) => {
        if (!measuring) return
        const delta = now - lastTime
        frameTimes.push(delta)
        if (delta > 33) droppedFrames++
        lastTime = now
        requestAnimationFrame(measure)
      }
      requestAnimationFrame(measure)

      // Scroll down steadily for 4 seconds
      const scrollDuration = 4000
      const scrollStart = performance.now()
      const totalScroll = list.scrollHeight - list.clientHeight

      const scrollStep = () => {
        const elapsed = performance.now() - scrollStart
        if (elapsed >= scrollDuration) return
        const progress = elapsed / scrollDuration
        list.scrollTop = totalScroll * progress
        requestAnimationFrame(scrollStep)
      }
      requestAnimationFrame(scrollStep)

      await new Promise(r => setTimeout(r, scrollDuration + 500))
      measuring = false

      // Skip first few frames (warmup)
      const warmFrames = frameTimes.slice(5)
      if (warmFrames.length === 0) return { error: 'No frames captured', avgFps: 0, minFps: 0, droppedFrames: 0, totalFrames: 0, rowsVisible }

      const avgDelta = warmFrames.reduce((a, b) => a + b, 0) / warmFrames.length
      const avgFps = Math.round(1000 / avgDelta)
      const maxDelta = Math.max(...warmFrames)
      const minFps = Math.round(1000 / maxDelta)
      const p95Delta = warmFrames.sort((a, b) => a - b)[Math.floor(warmFrames.length * 0.95)]
      const p95Fps = Math.round(1000 / p95Delta)

      return { avgFps, minFps, p95Fps, droppedFrames, totalFrames: warmFrames.length, rowsVisible }
    })

    console.log(`\n=== SCROLL FPS (5K items in collection) ===`)
    console.log(`Rows visible before scroll: ${results.rowsVisible}`)
    console.log(`Total frames: ${results.totalFrames}`)
    console.log(`Average FPS: ${results.avgFps}`)
    console.log(`P95 FPS: ${(results as any).p95Fps}`)
    console.log(`Min FPS: ${results.minFps}`)
    console.log(`Dropped frames (below 30fps): ${results.droppedFrames}`)
    if ((results as any).error) console.log(`Error: ${(results as any).error}`)

    expect(results.avgFps, 'Average FPS during scroll').toBeGreaterThan(15)
  })

  test('rows render during scroll (no blank rows)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(2000)

    await page.locator('a[href="/collection"]').last().click({ force: true })
    await page.waitForURL('**/collection')
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="song-row"]').length > 0,
      { timeout: 15_000 }
    )
    await page.waitForTimeout(1000)

    // Scroll to middle of list and check rows render
    const result = await page.evaluate(async () => {
      const list = document.querySelector('.music-table .ReactVirtualized__List')
      if (!list) return { error: 'List not found', songRows: 0, loadingRows: 0 }

      // Jump to middle
      list.scrollTop = list.scrollHeight / 2
      await new Promise(r => setTimeout(r, 500))

      const songRows = document.querySelectorAll('[data-testid="song-row"]').length
      const loadingRows = document.querySelectorAll('.animate-pulse').length

      // Jump to 75%
      list.scrollTop = list.scrollHeight * 0.75
      await new Promise(r => setTimeout(r, 500))

      const songRows2 = document.querySelectorAll('[data-testid="song-row"]').length
      const loadingRows2 = document.querySelectorAll('.animate-pulse').length

      return {
        midSongRows: songRows,
        midLoadingRows: loadingRows,
        lateSongRows: songRows2,
        lateLoadingRows: loadingRows2,
      }
    })

    console.log(`\n=== ROW RENDERING CHECK (5K items) ===`)
    console.log(`At 50%: ${result.midSongRows} song rows, ${result.midLoadingRows} loading rows`)
    console.log(`At 75%: ${result.lateSongRows} song rows, ${result.lateLoadingRows} loading rows`)
    if ((result as any).error) console.log(`Error: ${(result as any).error}`)

    expect(result.midSongRows, 'Song rows at 50% scroll').toBeGreaterThan(0)
    expect(result.midLoadingRows, 'Loading rows at 50% scroll').toBe(0)
    expect(result.lateSongRows, 'Song rows at 75% scroll').toBeGreaterThan(0)
    expect(result.lateLoadingRows, 'Loading rows at 75% scroll').toBe(0)
  })

  test('long tasks during scroll', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 5000)
    await page.waitForTimeout(2000)

    await page.locator('a[href="/collection"]').last().click({ force: true })
    await page.waitForURL('**/collection')
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="song-row"]').length > 0,
      { timeout: 15_000 }
    )
    await page.waitForTimeout(1000)

    const results = await page.evaluate(async () => {
      const list = document.querySelector('.music-table .ReactVirtualized__List')
      if (!list) return { error: 'List not found', longTasks: 0, totalBlockingTime: 0, maxTask: 0 }

      let longTasks = 0
      let totalBlockingTime = 0
      let maxTask = 0
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          longTasks++
          totalBlockingTime += entry.duration - 50
          if (entry.duration > maxTask) maxTask = entry.duration
        }
      })
      observer.observe({ type: 'longtask', buffered: false })

      // Scroll through entire list in steps
      const totalScroll = list.scrollHeight - list.clientHeight
      const steps = 20
      for (let i = 0; i <= steps; i++) {
        list.scrollTop = (totalScroll * i) / steps
        await new Promise(r => setTimeout(r, 200))
      }

      await new Promise(r => setTimeout(r, 500))
      observer.disconnect()

      return {
        longTasks,
        totalBlockingTime: Math.round(totalBlockingTime),
        maxTask: Math.round(maxTask),
      }
    })

    console.log(`\n=== LONG TASKS DURING SCROLL (5K items) ===`)
    console.log(`Long tasks: ${results.longTasks}`)
    console.log(`Total blocking time: ${results.totalBlockingTime}ms`)
    console.log(`Max single task: ${results.maxTask}ms`)

    expect(results.longTasks, 'Long tasks during scroll').toBeLessThan(10)
  })
})
