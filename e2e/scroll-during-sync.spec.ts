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
          id: `sync-scroll-${idx}`,
          title: `Song ${String(idx).padStart(5, '0')}`,
          artist: { id: `artist-${idx % 100}`, name: `Artist ${idx % 100}` },
          album: { id: `album-${idx % 500}`, name: `Album ${idx % 500}`, artistId: `artist-${idx % 100}` },
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

test.describe('Scroll During Sync', () => {
  test.describe.configure({ timeout: 120_000 })

  test('FPS during scroll while background sync adds items', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
    await page.waitForTimeout(2000)

    await page.locator('a[href="/collection"]').last().click({ force: true })
    await page.waitForURL('**/collection')
    await page.waitForFunction(
      () => document.querySelectorAll('[data-testid="song-row"]').length > 0,
      { timeout: 15_000 }
    )
    await page.waitForTimeout(1000)

    // Start scrolling while simultaneously adding new media
    // This simulates Navidrome sync running in background
    const results = await page.evaluate(async () => {
      const store = (window as any).__liveStore
      const { mediaEvents } = await import('/src/stores/livestore/events/media.ts')
      const list = document.querySelector('.music-table .ReactVirtualized__List')
      if (!list) return { error: 'List not found' }

      const frameTimes: number[] = []
      let lastTime = performance.now()
      let measuring = true
      let droppedFrames = 0

      const measure = (now: number) => {
        if (!measuring) return
        const delta = now - lastTime
        frameTimes.push(delta)
        if (delta > 33) droppedFrames++
        lastTime = now
        requestAnimationFrame(measure)
      }
      requestAnimationFrame(measure)

      // Simulate sync: add 10 batches of 50 items, 200ms apart
      // (mimics progressiveHydration with flush every batch)
      const syncPromise = (async () => {
        for (let batch = 0; batch < 10; batch++) {
          const media = Array.from({ length: 50 }, (_, i) => ({
            id: `bg-sync-${batch}-${i}`,
            title: `BG Song ${batch}-${i}`,
            artist: { id: `bg-artist-${i % 10}`, name: `BG Artist ${i % 10}` },
            album: { id: `bg-album-${i % 20}`, name: `BG Album ${i % 20}`, artistId: `bg-artist-${i % 10}` },
            type: 'audio',
            duration: 200000,
            stream: { dummy: { url: `http://localhost/bg/${batch}-${i}.mp3`, quality: 'high' } },
            genres: ['bg-genre'],
          }))
          // Each batch commits + refreshes (like old progressiveHydration)
          await store.commit({ skipRefresh: true }, mediaEvents.mediaBulkAdded({ media }))
          store.manualRefresh({ label: `bg-sync-batch-${batch}` })
          await new Promise(r => setTimeout(r, 200))
        }
      })()

      // Simultaneously scroll
      const scrollPromise = (async () => {
        for (let i = 0; i < 120; i++) {
          list.scrollTop += 150
          await new Promise(r => setTimeout(r, 16))
        }
      })()

      await Promise.all([syncPromise, scrollPromise])
      await new Promise(r => setTimeout(r, 500))
      measuring = false

      const warmFrames = frameTimes.slice(5)
      const avgDelta = warmFrames.reduce((a, b) => a + b, 0) / warmFrames.length
      const avgFps = Math.round(1000 / avgDelta)
      const maxDelta = Math.max(...warmFrames)
      const minFps = Math.round(1000 / maxDelta)

      return { avgFps, minFps, droppedFrames, totalFrames: warmFrames.length }
    })

    console.log(`\n=== SCROLL FPS DURING BACKGROUND SYNC (4K items, +500 syncing) ===`)
    console.log(`Average FPS: ${results.avgFps}`)
    console.log(`Min FPS: ${results.minFps}`)
    console.log(`Dropped frames: ${results.droppedFrames}`)
    console.log(`Total frames: ${results.totalFrames}`)

    expect(results.avgFps, 'FPS during scroll + sync').toBeGreaterThan(15)
  })

  test('FPS during scroll WITHOUT background sync (control)', async ({ page }) => {
    await page.goto('/')
    await waitForLiveStore(page)
    await seedMedia(page, 4000)
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
      if (!list) return { error: 'List not found' }

      const frameTimes: number[] = []
      let lastTime = performance.now()
      let measuring = true
      let droppedFrames = 0

      const measure = (now: number) => {
        if (!measuring) return
        const delta = now - lastTime
        frameTimes.push(delta)
        if (delta > 33) droppedFrames++
        lastTime = now
        requestAnimationFrame(measure)
      }
      requestAnimationFrame(measure)

      // Same scroll speed, no sync
      for (let i = 0; i < 120; i++) {
        list.scrollTop += 150
        await new Promise(r => setTimeout(r, 16))
      }

      await new Promise(r => setTimeout(r, 500))
      measuring = false

      const warmFrames = frameTimes.slice(5)
      const avgDelta = warmFrames.reduce((a, b) => a + b, 0) / warmFrames.length
      const avgFps = Math.round(1000 / avgDelta)
      const maxDelta = Math.max(...warmFrames)
      const minFps = Math.round(1000 / maxDelta)

      return { avgFps, minFps, droppedFrames, totalFrames: warmFrames.length }
    })

    console.log(`\n=== SCROLL FPS WITHOUT SYNC (4K items, control) ===`)
    console.log(`Average FPS: ${results.avgFps}`)
    console.log(`Min FPS: ${results.minFps}`)
    console.log(`Dropped frames: ${results.droppedFrames}`)
    console.log(`Total frames: ${results.totalFrames}`)

    expect(results.avgFps, 'FPS during scroll alone').toBeGreaterThan(30)
  })
})
