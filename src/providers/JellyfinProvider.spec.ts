import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import JellyfinProvider from './JellyfinProvider'

describe('JellyfinProvider.healthcheck', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  const make = () => new JellyfinProvider(
    { baseUrl: 'https://jelly.example.com', apiKey: 'KEY', username: 'u', password: 'p' },
    'jellyfin',
  )

  const mockGet = (impl: (url: string, cfg?: unknown) => Promise<unknown>) => {
    vi.spyOn(axios, 'get').mockImplementation(impl as never)
  }

  it('returns connected when public info and Users/Me both succeed', async () => {
    mockGet(async (url) => {
      if (url.includes('/System/Info/Public')) return { status: 200, data: { Version: '10.8' } }
      if (url.includes('/Users/Me')) return { status: 200, data: { Name: 'u' } }
      throw new Error('unexpected ' + url)
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('connected')
    expect(typeof res.latencyMs).toBe('number')
  })

  it('returns authFailed when public info succeeds but Users/Me returns 401', async () => {
    mockGet(async (url) => {
      if (url.includes('/System/Info/Public')) return { status: 200, data: {} }
      if (url.includes('/Users/Me')) throw Object.assign(new Error('Unauthorized'), { response: { status: 401 } })
      throw new Error('unexpected ' + url)
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('authFailed')
  })

  it('returns unreachable when public info rejects', async () => {
    mockGet(async () => { throw new Error('ECONNREFUSED') })
    const res = await make().healthcheck!()
    expect(res.status).toBe('unreachable')
    expect(res.error).toContain('ECONNREFUSED')
    expect(typeof res.latencyMs).toBe('number')
  })

  it('returns unreachable when Users/Me returns a non-401 error', async () => {
    mockGet(async (url) => {
      if (url.includes('/System/Info/Public')) return { status: 200, data: {} }
      if (url.includes('/Users/Me')) throw Object.assign(new Error('Server error'), { response: { status: 500 } })
      throw new Error('unexpected ' + url)
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('unreachable')
    expect(typeof res.latencyMs).toBe('number')
  })
})
