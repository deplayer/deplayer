/** Globals exposed on `window` by the app (dev) and by e2e perf monitors. */
interface E2ELiveStore {
  commit(...args: unknown[]): Promise<void> | void
  manualRefresh(options: { label: string }): void
}

interface Window {
  __liveStore?: E2ELiveStore
  __perfLongTasks: number
  __perfTotalBlocking: number
  __perfFrameDips: number
  __perfMaxFrameGap: number
  __perfMeasuring: boolean
  __perfObserver?: PerformanceObserver
}
