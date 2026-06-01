import { useCallback, useEffect, useRef, useState } from 'react'
import type { HealthCheckResult } from '../../../types/providers'

/**
 * Factory that resolves a provider instance for a given key + config.
 *
 * Returning `undefined` (or an object without a `healthcheck` method) signals
 * that the provider cannot self-report health — the hook surfaces `unknown`.
 */
export type ProviderHealthFactory = (
  providerKey: string,
  config: Record<string, unknown>,
) => { healthcheck?: () => Promise<HealthCheckResult> } | undefined

export type UseProviderHealthReturn = {
  result: HealthCheckResult
  refresh: () => void
}

const DEBOUNCE_MS = 200

const makeDisabled = (): HealthCheckResult => ({ status: 'disabled', checkedAt: 0 })
const makeUnknown = (): HealthCheckResult => ({ status: 'unknown', checkedAt: 0 })
const makeChecking = (): HealthCheckResult => ({ status: 'checking', checkedAt: 0 })

/**
 * Probe a provider's healthcheck on mount, on config change, and on explicit
 * refresh. Session-only — never touches LiveStore, Redux, or persistence.
 *
 * - Initial render synchronously returns disabled / unknown / checking.
 * - The effect re-fires when providerKey or any field of `config` changes,
 *   or when `refresh()` is invoked.
 * - Late results from a superseded probe are dropped via an `cancelled` flag.
 * - `refresh()` is debounced: rapid calls within 200ms coalesce into one probe.
 */
export const useProviderHealth = (
  providerKey: string,
  config: Record<string, unknown>,
  factory: ProviderHealthFactory,
): UseProviderHealthReturn => {
  const enabled = config.enabled !== false
  const provider = factory(providerKey, config)
  const hasHealthcheck = typeof provider?.healthcheck === 'function'

  const [result, setResult] = useState<HealthCheckResult>(() =>
    !enabled ? makeDisabled() : !hasHealthcheck ? makeUnknown() : makeChecking(),
  )
  const [refreshCounter, setRefreshCounter] = useState(0)
  const lastRefreshRef = useRef(0)

  const refresh = useCallback(() => {
    const now = Date.now()
    if (now - lastRefreshRef.current < DEBOUNCE_MS) return
    lastRefreshRef.current = now
    setRefreshCounter(c => c + 1)
  }, [])

  const configKey = JSON.stringify(config)

  useEffect(() => {
    if (!enabled) {
      setResult(makeDisabled())
      return
    }
    if (!hasHealthcheck || !provider?.healthcheck) {
      setResult(makeUnknown())
      return
    }
    setResult(makeChecking())
    let cancelled = false
    const probe = provider.healthcheck
    void probe().then(
      r => {
        if (!cancelled) setResult(r)
      },
      e => {
        if (cancelled) return
        setResult({
          status: 'unreachable',
          error: e instanceof Error ? e.message : String(e),
          checkedAt: Date.now(),
          latencyMs: undefined,
        })
      },
    )
    return () => {
      cancelled = true
    }
    // `provider` and `factory` are intentionally excluded — callers pass a new
    // factory reference every render, but the probe must only refire when the
    // *inputs* (providerKey, config, refresh counter) change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKey, configKey, refreshCounter, enabled, hasHealthcheck])

  return { result, refresh }
}
