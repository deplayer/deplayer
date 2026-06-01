import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProviderHealth, type ProviderHealthFactory } from './useProviderHealth'
import type { HealthCheckResult } from '../../../types/providers'

const flush = () => new Promise<void>(r => setTimeout(r, 0))

describe('useProviderHealth', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }) })
  afterEach(() => { vi.useRealTimers() })

  const makeFactory = (healthcheck?: () => Promise<HealthCheckResult>): ProviderHealthFactory =>
    () => (healthcheck ? { healthcheck } : { })

  it('returns checking synchronously on first render', () => {
    const { result } = renderHook(() =>
      useProviderHealth('subsonic', { enabled: true }, makeFactory(async () => ({ status: 'connected', checkedAt: 1 }))),
    )
    expect(result.current.result.status).toBe('checking')
  })

  it('calls healthcheck once on mount and surfaces the resolved status', async () => {
    const hc = vi.fn().mockResolvedValue({ status: 'connected', checkedAt: 42, latencyMs: 5 } satisfies HealthCheckResult)
    const { result } = renderHook(() => useProviderHealth('subsonic', { enabled: true }, makeFactory(hc)))
    await waitFor(() => expect(result.current.result.status).toBe('connected'))
    expect(hc).toHaveBeenCalledTimes(1)
  })

  it('returns disabled and does not call healthcheck when enabled is false', async () => {
    const hc = vi.fn().mockResolvedValue({ status: 'connected', checkedAt: 1 })
    const { result } = renderHook(() => useProviderHealth('subsonic', { enabled: false }, makeFactory(hc)))
    expect(result.current.result.status).toBe('disabled')
    await flush()
    expect(hc).not.toHaveBeenCalled()
  })

  it('returns unknown and does not call healthcheck when factory returns no healthcheck method', async () => {
    const factory: ProviderHealthFactory = () => ({})
    const { result } = renderHook(() => useProviderHealth('itunes', { enabled: true }, factory))
    expect(result.current.result.status).toBe('unknown')
    await flush()
  })

  it('refresh() triggers a second healthcheck call', async () => {
    const hc = vi.fn().mockResolvedValue({ status: 'connected', checkedAt: 1 })
    const { result } = renderHook(() => useProviderHealth('subsonic', { enabled: true }, makeFactory(hc)))
    await waitFor(() => expect(hc).toHaveBeenCalledTimes(1))
    act(() => { result.current.refresh() })
    await waitFor(() => expect(hc).toHaveBeenCalledTimes(2))
  })

  it('debounces rapid refresh calls within 200ms to a single probe', async () => {
    const hc = vi.fn().mockResolvedValue({ status: 'connected', checkedAt: 1 })
    const { result } = renderHook(() => useProviderHealth('subsonic', { enabled: true }, makeFactory(hc)))
    await waitFor(() => expect(hc).toHaveBeenCalledTimes(1))
    act(() => { result.current.refresh(); result.current.refresh(); result.current.refresh() })
    await flush()
    expect(hc).toHaveBeenCalledTimes(2) // initial + one coalesced refresh
  })

  it('drops late results after the effect was re-triggered (no state update)', async () => {
    let resolveFirst!: (r: HealthCheckResult) => void
    const firstPromise = new Promise<HealthCheckResult>(r => { resolveFirst = r })
    const hc = vi.fn().mockReturnValueOnce(firstPromise).mockResolvedValue({ status: 'connected', checkedAt: 2 })
    const { result, rerender } = renderHook(
      ({ key }: { key: string }) => useProviderHealth(key, { enabled: true }, makeFactory(hc)),
      { initialProps: { key: 'subsonic' } },
    )
    rerender({ key: 'subsonic2' })  // re-keys the effect
    await waitFor(() => expect(hc).toHaveBeenCalledTimes(2))
    // Now resolve the FIRST promise late — must not flip state back to its result
    resolveFirst({ status: 'authFailed', checkedAt: 99, error: 'late' })
    await flush()
    expect(result.current.result.status).not.toBe('authFailed')
  })
})
