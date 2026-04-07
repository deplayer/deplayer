# Cover Image Loading Optimization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace uncontrolled cover image loading with a concurrency-limited, deduplicated, cached service to stop overwhelming Navidrome.

**Architecture:** A singleton `CoverImageService` handles all image fetching with max 3 concurrent requests (LIFO queue), URL deduplication, and Cache API persistence. A `useCoverImage` hook wraps it for React components. `LazyImage` is deleted.

**Tech Stack:** TypeScript, React hooks, Cache API, AbortController, Vitest

---

### Task 1: Create CoverImageService

**Files:**
- Create: `src/services/CoverImageService.ts`
- Create: `src/services/CoverImageService.spec.ts`

**Step 1: Write the failing test**

```ts
// src/services/CoverImageService.spec.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoverImageService } from './CoverImageService'

// Mock Cache API
const mockCache = {
  match: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
}
vi.stubGlobal('caches', {
  open: vi.fn().mockResolvedValue(mockCache),
})

// Mock fetch
const createMockResponse = () => ({
  ok: true,
  clone: function() { return this },
  blob: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'image/jpeg' })),
})

describe('CoverImageService', () => {
  let service: CoverImageService

  beforeEach(() => {
    service = new CoverImageService({ maxConcurrent: 3 })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse()))
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
    mockCache.match.mockResolvedValue(undefined)
  })

  afterEach(() => {
    service.destroy()
    vi.restoreAllMocks()
  })

  it('should fetch an image and return an object URL', async () => {
    const controller = new AbortController()
    const result = await service.request('https://example.com/cover1', controller.signal)
    expect(result).toBe('blob:fake-url')
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should deduplicate concurrent requests for the same URL', async () => {
    const c1 = new AbortController()
    const c2 = new AbortController()
    const [r1, r2] = await Promise.all([
      service.request('https://example.com/same', c1.signal),
      service.request('https://example.com/same', c2.signal),
    ])
    expect(r1).toBe(r2)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('should respect max concurrency', async () => {
    let resolvers: Array<(v: any) => void> = []
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => {
      resolvers.push(() => resolve(createMockResponse() as any))
    }))

    const controllers = Array.from({ length: 5 }, () => new AbortController())
    const promises = controllers.map((c, i) =>
      service.request(`https://example.com/cover${i}`, c.signal)
    )

    // Wait for microtasks to settle
    await new Promise(r => setTimeout(r, 10))

    // Only 3 should be in-flight
    expect(resolvers.length).toBe(3)

    // Resolve all and let queue drain
    resolvers.forEach(r => r(undefined))
    await new Promise(r => setTimeout(r, 10))
    resolvers.slice(3).forEach(r => r?.(undefined))

    // Resolve remaining
    resolvers.forEach(r => r?.(undefined))
    await Promise.allSettled(promises)
  })

  it('should return cached image without fetching', async () => {
    const cachedResponse = createMockResponse()
    mockCache.match.mockResolvedValue(cachedResponse)

    const controller = new AbortController()
    const result = await service.request('https://example.com/cached', controller.signal)
    expect(result).toBe('blob:fake-url')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should abort fetch when signal is aborted and no other consumers', async () => {
    let fetchAbortSignal: AbortSignal | undefined
    vi.mocked(fetch).mockImplementation((_url, opts: any) => {
      fetchAbortSignal = opts?.signal
      return new Promise(() => {}) // Never resolves
    })

    const controller = new AbortController()
    const promise = service.request('https://example.com/abort', controller.signal)
    await new Promise(r => setTimeout(r, 10))

    controller.abort()
    await expect(promise).rejects.toThrow()
    expect(fetchAbortSignal?.aborted).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/services/CoverImageService.spec.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```ts
// src/services/CoverImageService.ts

type QueueEntry = {
  url: string
  resolve: (value: string) => void
  reject: (reason: any) => void
  consumers: Set<AbortSignal>
  fetchController: AbortController
}

type InFlightEntry = {
  promise: Promise<string>
  consumers: Set<AbortSignal>
  fetchController: AbortController
}

const CACHE_NAME = 'deplayer-covers'

export class CoverImageService {
  private maxConcurrent: number
  private queue: QueueEntry[] = [] // LIFO — pop from end
  private inFlight = new Map<string, InFlightEntry>()
  private resolved = new Map<string, string>() // url -> objectURL
  private activeCount = 0

  constructor(opts: { maxConcurrent?: number } = {}) {
    this.maxConcurrent = opts.maxConcurrent ?? 3
  }

  async request(url: string, signal: AbortSignal): Promise<string> {
    // Already resolved — return immediately
    const cached = this.resolved.get(url)
    if (cached) return cached

    // Already in-flight — join existing request
    const existing = this.inFlight.get(url)
    if (existing) {
      existing.consumers.add(signal)
      this.listenForAbort(signal, url)
      return existing.promise
    }

    // Check queue for existing entry with same URL
    const queued = this.queue.find(e => e.url === url)
    if (queued) {
      queued.consumers.add(signal)
      this.listenForAbort(signal, url)
      return new Promise<string>((resolve, reject) => {
        const origResolve = queued.resolve
        const origReject = queued.reject
        queued.resolve = (v) => { origResolve(v); resolve(v) }
        queued.reject = (r) => { origReject(r); reject(r) }
      })
    }

    // New request — enqueue
    return new Promise<string>((resolve, reject) => {
      const fetchController = new AbortController()
      const consumers = new Set<AbortSignal>([signal])
      this.queue.push({ url, resolve, reject, consumers, fetchController })
      this.listenForAbort(signal, url)
      this.drain()
    })
  }

  private listenForAbort(signal: AbortSignal, url: string) {
    if (signal.aborted) {
      this.handleAbort(url, signal)
      return
    }
    signal.addEventListener('abort', () => this.handleAbort(url, signal), { once: true })
  }

  private handleAbort(url: string, signal: AbortSignal) {
    // Check in-flight
    const inFlight = this.inFlight.get(url)
    if (inFlight) {
      inFlight.consumers.delete(signal)
      if (inFlight.consumers.size === 0) {
        inFlight.fetchController.abort()
        this.inFlight.delete(url)
        this.activeCount--
        this.drain()
      }
      return
    }

    // Check queue
    const idx = this.queue.findIndex(e => e.url === url)
    if (idx !== -1) {
      const entry = this.queue[idx]
      entry.consumers.delete(signal)
      if (entry.consumers.size === 0) {
        this.queue.splice(idx, 1)
        entry.reject(new DOMException('Aborted', 'AbortError'))
      }
    }
  }

  private drain() {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const entry = this.queue.pop()! // LIFO
      this.activeCount++
      const promise = this.fetchImage(entry)
      this.inFlight.set(entry.url, {
        promise,
        consumers: entry.consumers,
        fetchController: entry.fetchController,
      })
    }
  }

  private async fetchImage(entry: QueueEntry): Promise<string> {
    try {
      // Check Cache API first
      const cache = await caches.open(CACHE_NAME)
      const cachedResponse = await cache.match(entry.url)
      if (cachedResponse) {
        const blob = await cachedResponse.blob()
        const objectUrl = URL.createObjectURL(blob)
        this.resolved.set(entry.url, objectUrl)
        entry.resolve(objectUrl)
        return objectUrl
      }

      // Fetch from network
      const response = await fetch(entry.url, {
        signal: entry.fetchController.signal,
        mode: 'cors',
        credentials: 'omit',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Cache the response
      await cache.put(entry.url, response.clone())

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      this.resolved.set(entry.url, objectUrl)
      entry.resolve(objectUrl)
      return objectUrl
    } catch (err) {
      entry.reject(err)
      throw err
    } finally {
      this.inFlight.delete(entry.url)
      this.activeCount--
      this.drain()
    }
  }

  destroy() {
    // Abort all in-flight
    for (const entry of this.inFlight.values()) {
      entry.fetchController.abort()
    }
    // Reject all queued
    for (const entry of this.queue) {
      entry.reject(new DOMException('Destroyed', 'AbortError'))
    }
    // Revoke all object URLs
    for (const objectUrl of this.resolved.values()) {
      URL.revokeObjectURL(objectUrl)
    }
    this.inFlight.clear()
    this.queue = []
    this.resolved.clear()
    this.activeCount = 0
  }
}

// Singleton instance
export const coverImageService = new CoverImageService()
```

**Step 4: Run tests**

Run: `npm test -- src/services/CoverImageService.spec.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/services/CoverImageService.ts src/services/CoverImageService.spec.ts
git commit -m "feat: add CoverImageService with concurrency, dedup, and caching"
```

---

### Task 2: Create useCoverImage hook

**Files:**
- Create: `src/hooks/useCoverImage.ts`
- Create: `src/hooks/useCoverImage.spec.ts`

**Step 1: Write the failing test**

```ts
// src/hooks/useCoverImage.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCoverImage } from './useCoverImage'

// Mock the service
vi.mock('../services/CoverImageService', () => ({
  coverImageService: {
    request: vi.fn(),
  },
}))

import { coverImageService } from '../services/CoverImageService'

describe('useCoverImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:url'),
      revokeObjectURL: vi.fn(),
    })
  })

  it('should return undefined initially then object URL when loaded', async () => {
    vi.mocked(coverImageService.request).mockResolvedValue('blob:loaded')

    const { result } = renderHook(() => useCoverImage('https://example.com/cover'))

    // Initially undefined
    expect(result.current).toBeUndefined()

    // After resolution
    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    expect(result.current).toBe('blob:loaded')
  })

  it('should return undefined when no URL provided', () => {
    const { result } = renderHook(() => useCoverImage(undefined))
    expect(result.current).toBeUndefined()
    expect(coverImageService.request).not.toHaveBeenCalled()
  })

  it('should revoke object URL on unmount', async () => {
    vi.mocked(coverImageService.request).mockResolvedValue('blob:to-revoke')

    const { unmount } = renderHook(() => useCoverImage('https://example.com/cover'))

    await act(async () => {
      await new Promise(r => setTimeout(r, 10))
    })

    unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:to-revoke')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/hooks/useCoverImage.spec.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```ts
// src/hooks/useCoverImage.ts
import { useState, useEffect, useRef } from 'react'
import { coverImageService } from '../services/CoverImageService'

export function useCoverImage(url: string | undefined): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string | undefined>(undefined)
  const currentUrlRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!url) {
      setObjectUrl(undefined)
      return
    }

    currentUrlRef.current = url
    const controller = new AbortController()

    coverImageService
      .request(url, controller.signal)
      .then((result) => {
        // Only update if this is still the current request
        if (currentUrlRef.current === url) {
          setObjectUrl(result)
        }
      })
      .catch(() => {
        // Aborted or failed — ignore
      })

    return () => {
      controller.abort()
      setObjectUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev)
        }
        return undefined
      })
    }
  }, [url])

  return objectUrl
}
```

**Step 4: Run tests**

Run: `npm test -- src/hooks/useCoverImage.spec.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/hooks/useCoverImage.ts src/hooks/useCoverImage.spec.ts
git commit -m "feat: add useCoverImage hook"
```

---

### Task 3: Add `&size=100` to SubsonicApiProvider thumbnailUrl

**Files:**
- Modify: `src/providers/SubsonicApiProvider.ts`

**Step 1: Find and update the thumbnailUrl line**

In `src/providers/SubsonicApiProvider.ts`, change:

```ts
thumbnailUrl: this.coverBase + "&id=" + song.coverArt,
```

to:

```ts
thumbnailUrl: this.coverBase + "&id=" + song.coverArt + "&size=100",
```

Do NOT change the `fullUrl` line.

**Step 2: Run existing tests**

Run: `npm test -- src/providers/`
Expected: PASS (no test references specific URL format)

**Step 3: Commit**

```bash
git add src/providers/SubsonicApiProvider.ts
git commit -m "perf: add size=100 to Subsonic thumbnail URLs"
```

---

### Task 4: Rewrite CoverImage to use useCoverImage, remove LazyImage

**Files:**
- Modify: `src/components/MusicTable/CoverImage.tsx`
- Modify: `src/components/MusicTable/CoverImage.spec.tsx`
- Delete: `src/components/LazyImage/index.tsx`

**Step 1: Rewrite CoverImage.tsx**

```tsx
// src/components/MusicTable/CoverImage.tsx
import classNames from 'classnames'
import React from 'react'
import { useCoverImage } from '../../hooks/useCoverImage'

type Cover = {
  thumbnailUrl: string,
  fullUrl: string
}

type Props = {
  cover?: Cover,
  reflect?: boolean,
  size?: string,
  onClick?: () => void,
  useImage?: boolean,
  albumName: string,
  noFade?: boolean
}

const CoverImage = ({ cover, reflect, size, onClick, useImage, albumName, noFade }: Props) => {
  const rawUrl = cover
    ? (size === 'full' && cover.fullUrl ? cover.fullUrl : cover.thumbnailUrl)
    : undefined

  const objectUrl = useCoverImage(rawUrl)
  const displayUrl = objectUrl || '/disc.svg'
  const isPlaceholder = !objectUrl

  if (useImage) {
    return (
      <div className="lazy-image w-full bg-no-repeat bg-center cursor-pointer" onClick={onClick}>
        <div className="relative w-full h-full">
          <img
            src={displayUrl}
            alt={`${albumName} cover`}
            className={classNames(
              "w-full h-full object-cover",
              {
                "transition-opacity duration-300": !noFade,
                "opacity-0": !noFade && !objectUrl && !isPlaceholder,
                "opacity-100": noFade || !!objectUrl || isPlaceholder,
              }
            )}
            draggable={false}
          />
        </div>
      </div>
    )
  }

  const className = classNames(
    'cover-image relative',
    'lazy-image w-full bg-no-repeat bg-center cursor-pointer',
    {
      'reflected-image': reflect,
      'transition-opacity duration-300': !noFade,
      'opacity-100': noFade || !!objectUrl || isPlaceholder,
    }
  )

  return (
    <div
      data-testid='cover-image'
      className={className}
      onClick={onClick}
      style={{
        backgroundImage: `url(${displayUrl})`,
        backgroundSize: 'cover',
      }}
      data-alt={`${albumName} cover`}
    />
  )
}

export default React.memo(CoverImage)
```

**Step 2: Update CoverImage.spec.tsx**

```tsx
// src/components/MusicTable/CoverImage.spec.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CoverImage from './CoverImage'

// Mock the hook
vi.mock('../../hooks/useCoverImage', () => ({
  useCoverImage: vi.fn().mockReturnValue(undefined),
}))

describe('CoverImage', () => {
  it('should render without errors', () => {
    render(
      <CoverImage
        cover={{ fullUrl: '', thumbnailUrl: '' }}
        size="thumbnail"
        albumName="My album"
      />
    )
    expect(screen.getByTestId('cover-image')).toBeTruthy()
  })

  it('should show placeholder when no cover provided', () => {
    render(<CoverImage albumName="No cover" />)
    const el = screen.getByTestId('cover-image')
    expect(el.style.backgroundImage).toContain('disc.svg')
  })
})
```

**Step 3: Delete LazyImage**

```bash
rm src/components/LazyImage/index.tsx
rmdir src/components/LazyImage
```

**Step 4: Run all tests**

Run: `npm test`
Expected: All PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: rewrite CoverImage with useCoverImage, remove LazyImage"
```

---

### Task 5: Update Player Cover component

**Files:**
- Modify: `src/components/Player/Cover.tsx`

**Step 1: Remove the manual `new Image()` preloading**

The `Cover` component has its own `new Image()` preload logic (lines with `useEffect`, `imageRef`). This is now handled by `CoverImageService` via `CoverImage`. Remove it:

```tsx
// src/components/Player/Cover.tsx
import { useState } from 'react'
import CoverImage from '../MusicTable/CoverImage'
import Modal from '../common/Modal'
import Media from '../../entities/Media'

type Props = {
  slim?: boolean,
  song?: Media | null,
  onClick?: () => void
}

const Cover = (props: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const song = props.song

  if (props.slim || !song) {
    return null
  }

  const handleClick = () => {
    setIsModalOpen(true)
    if (props.onClick) {
      props.onClick()
    }
  }

  const albumName = song.album ? song.album.name : 'N/A'

  return (
    <>
      <div
        className='relative text-lg hidden md:block cursor-pointer w-16 h-16 aspect-square'
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-testid="cover-container"
      >
        <div className="w-full h-full">
          <CoverImage
            useImage
            cover={song.cover}
            size='thumbnail'
            albumName={albumName}
            noFade
          />
        </div>

        {/* Hover Preview */}
        <div
          className={`absolute z-[100] bg-base-100 p-2 rounded-lg shadow-xl transition-all duration-200 ${isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
          style={{
            bottom: 'calc(100% + 10px)',
            left: '0',
            width: '200px',
            aspectRatio: '1/1',
            pointerEvents: 'none'
          }}
          data-testid="hover-preview"
        >
          <CoverImage
            useImage
            cover={song.cover}
            size='medium'
            albumName={albumName}
            noFade
          />
        </div>
      </div>

      {/* Fullscreen Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={albumName}
      >
        <div className="flex justify-center items-center">
          <div className="w-full max-w-2xl aspect-square">
            <CoverImage
              useImage
              cover={song.cover}
              size='full'
              albumName={albumName}
              noFade
            />
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Cover
```

Note: Removed `isImageLoaded` gate on hover preview — the `CoverImage` component handles loading state internally now. The preview always renders but shows placeholder until loaded.

**Step 2: Run Cover tests**

Run: `npm test -- src/components/Player/Cover`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Player/Cover.tsx
git commit -m "refactor: remove manual image preload from Player Cover"
```

---

### Task 6: Clean up lazy-image styles

**Files:**
- Delete: `src/styles/lazy-image.scss`
- Modify: `src/styles/App.scss` — remove `@import './lazy-image.scss';`
- Verify: `src/styles/artist-view.scss` — check if `.lazy-image` rules are still needed (they style the container which we kept as a class name)

**Step 1: Remove the import from App.scss**

In `src/styles/App.scss`, delete the line:
```scss
@import './lazy-image.scss';
```

**Step 2: Delete lazy-image.scss**

```bash
rm src/styles/lazy-image.scss
```

**Step 3: Check artist-view.scss**

The `.lazy-image` class is still used in the new `CoverImage` component for layout (width, bg, cursor). The rules in `artist-view.scss` likely style it in that context — keep them.

**Step 4: Run full test suite**

Run: `npm test`
Expected: All PASS

**Step 5: Run build**

Run: `npm run build`
Expected: SUCCESS with no errors

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove lazy-image.scss, clean up unused styles"
```

---

### Task 7: Manual verification

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify in browser**

- Open collection with many songs
- Open DevTools → Network tab, filter by images
- Confirm max 3 concurrent image requests
- Confirm same album cover is only fetched once
- Scroll quickly — confirm no request flood
- Confirm images appear with placeholder → fade in
- Check DevTools → Application → Cache Storage → `deplayer-covers` has entries
- Refresh page — confirm images load instantly from cache
- Check player cover still works (thumbnail + hover preview + fullscreen modal)

**Step 3: Verify no console errors**

Check for any errors related to aborted fetches, revoked URLs, or CORS issues.
