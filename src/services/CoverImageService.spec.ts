import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CoverImageService } from './CoverImageService'

const mockCache = {
  match: vi.fn().mockResolvedValue(undefined),
  put: vi.fn().mockResolvedValue(undefined),
}
vi.stubGlobal('caches', {
  open: vi.fn().mockResolvedValue(mockCache),
})

const createMockResponse = () => ({
  ok: true,
  clone: function() { return this },
  blob: vi.fn().mockResolvedValue(new Blob(['fake'], { type: 'image/jpeg' })),
})

describe('CoverImageService', () => {
  let service: CoverImageService

  beforeEach(() => {
    service = new CoverImageService({ maxConcurrent: 3 })
    vi.stubGlobal('caches', { open: vi.fn().mockResolvedValue(mockCache) })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(createMockResponse()))
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:fake-url'),
      revokeObjectURL: vi.fn(),
    })
    mockCache.match.mockResolvedValue(undefined)
    mockCache.put.mockResolvedValue(undefined)
  })

  afterEach(() => {
    service.destroy()
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
    const resolvers: Array<(v: any) => void> = []
    vi.mocked(fetch).mockImplementation(() => new Promise(resolve => {
      resolvers.push(() => resolve(createMockResponse() as any))
    }))

    const controllers = Array.from({ length: 5 }, () => new AbortController())
    const promises = controllers.map((c, i) =>
      service.request('https://example.com/cover' + i, c.signal)
    )

    // Wait for microtasks to settle
    await new Promise(r => setTimeout(r, 10))

    // Only 3 should be in-flight
    expect(resolvers.length).toBe(3)

    // Resolve all and let queue drain
    resolvers.forEach(r => r(undefined))
    await new Promise(r => setTimeout(r, 10))
    resolvers.forEach(r => r?.(undefined))

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
    // Mock caches.open to return a cache with no match (so it proceeds to fetch)
    vi.stubGlobal('caches', {
      open: vi.fn().mockResolvedValue({
        match: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
      }),
    })
    vi.mocked(fetch).mockImplementation((_url, opts: any) => {
      fetchAbortSignal = opts?.signal
      return new Promise((_resolve, reject) => {
        // Simulate real fetch abort behavior
        opts?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        })
      })
    })

    const controller = new AbortController()
    const promise = service.request('https://example.com/abort', controller.signal)
    // Wait for cache check + fetch to start
    await new Promise(r => setTimeout(r, 50))

    controller.abort()
    await expect(promise).rejects.toThrow()
    expect(fetchAbortSignal?.aborted).toBe(true)
  })
})
