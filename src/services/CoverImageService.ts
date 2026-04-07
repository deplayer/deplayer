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
    // Check if already resolved — nothing to abort
    if (this.resolved.has(url)) return

    // Check in-flight
    const inFlight = this.inFlight.get(url)
    if (inFlight) {
      inFlight.consumers.delete(signal)
      if (inFlight.consumers.size === 0) {
        // Mark as removed so fetchImage's finally block doesn't double-decrement
        this.inFlight.delete(url)
        this.activeCount--
        inFlight.fetchController.abort()
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
      return '' // Swallow — consumer already rejected
    } finally {
      // Only decrement if not already cleaned up by handleAbort
      if (this.inFlight.has(entry.url)) {
        this.inFlight.delete(entry.url)
        this.activeCount--
        this.drain()
      }
    }
  }

  destroy() {
    for (const entry of this.inFlight.values()) {
      entry.fetchController.abort()
    }
    for (const entry of this.queue) {
      entry.reject(new DOMException('Destroyed', 'AbortError'))
    }
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
