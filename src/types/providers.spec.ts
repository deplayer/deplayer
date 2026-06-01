import { describe, it, expect } from 'vitest'
import type { HealthStatus, HealthCheckResult } from './providers'

describe('provider health types', () => {
  it('HealthStatus accepts the six documented states', () => {
    const states: HealthStatus[] = [
      'connected', 'checking', 'unreachable', 'authFailed', 'disabled', 'unknown',
    ]
    expect(states).toHaveLength(6)
  })

  it('HealthCheckResult carries status, optional error, optional latency, and checkedAt', () => {
    const ok: HealthCheckResult = { status: 'connected', latencyMs: 42, checkedAt: 0 }
    const bad: HealthCheckResult = { status: 'authFailed', error: 'wrong password', checkedAt: 0 }
    expect(ok.status).toBe('connected')
    expect(bad.error).toBe('wrong password')
  })
})
