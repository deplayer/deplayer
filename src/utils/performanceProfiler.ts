/**
 * Performance Profiler for debugging FPS drops
 * 
 * Usage:
 *   profiler.start('operation-name')
 *   // ... do work ...
 *   profiler.end('operation-name')
 *   
 *   profiler.mark('checkpoint-name')
 *   
 *   profiler.report() // prints all timings
 */

type TimingEntry = {
  name: string
  start: number
  end?: number
  duration?: number
}

class PerformanceProfiler {
  private timings: Map<string, TimingEntry> = new Map()
  private marks: Array<{ name: string; time: number }> = []
  private enabled = true
  
  enable() { this.enabled = true }
  disable() { this.enabled = false }
  
  start(name: string): void {
    if (!this.enabled) return
    this.timings.set(name, { name, start: performance.now() })
  }
  
  end(name: string): number {
    if (!this.enabled) return 0
    const entry = this.timings.get(name)
    if (entry) {
      entry.end = performance.now()
      entry.duration = entry.end - entry.start
      return entry.duration
    }
    return 0
  }
  
  mark(name: string): void {
    if (!this.enabled) return
    this.marks.push({ name, time: performance.now() })
  }
  
  /**
   * Measure a long task and check if it causes frame drops
   * A frame at 60fps = 16.67ms, anything longer will cause jank
   */
  measureTask<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (duration > 16) {
      console.warn(`[PERF] ⚠️ Long task "${name}": ${duration.toFixed(2)}ms (>16ms = frame drop)`)
    } else {
      console.log(`[PERF] ✓ Task "${name}": ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  async measureAsyncTask<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    if (duration > 50) {
      console.warn(`[PERF] ⚠️ Long async task "${name}": ${duration.toFixed(2)}ms`)
    } else {
      console.log(`[PERF] ✓ Async task "${name}": ${duration.toFixed(2)}ms`)
    }
    
    return result
  }
  
  report(): void {
    console.group('[PERF] Performance Report')
    
    // Print timings
    const sortedTimings = Array.from(this.timings.values())
      .filter(t => t.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    
    if (sortedTimings.length > 0) {
      console.log('Timings (slowest first):')
      sortedTimings.forEach(t => {
        const flag = (t.duration || 0) > 16 ? '⚠️' : '✓'
        console.log(`  ${flag} ${t.name}: ${t.duration?.toFixed(2)}ms`)
      })
    }
    
    // Print marks timeline
    if (this.marks.length > 0) {
      console.log('Timeline:')
      const baseTime = this.marks[0].time
      this.marks.forEach((m, i) => {
        const relativeTime = m.time - baseTime
        const delta = i > 0 ? m.time - this.marks[i - 1].time : 0
        console.log(`  +${relativeTime.toFixed(2)}ms: ${m.name} (Δ${delta.toFixed(2)}ms)`)
      })
    }
    
    console.groupEnd()
  }
  
  clear(): void {
    this.timings.clear()
    this.marks = []
  }
}

export const profiler = new PerformanceProfiler()

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as unknown as { __profiler: typeof profiler }).__profiler = profiler
}
