import axios from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'

import exampleSongs from './mstreamExampleSongs.json'
import MstreamApiProvider from './MstreamApiProvider'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /db/album-songs
// arguments for reply are (status, data, headers)
mock.onPost(/db\/album-songs/).reply(200, exampleSongs)

describe('MstreamApiProvider', () => {
  const mstreamRepo = new MstreamApiProvider({ baseUrl: '' }, '')

  it('should matchSearch against song', () => {
    expect(mstreamRepo.matchSearch(exampleSongs[1], 'Commando 9MM')).toBe(true)
    expect(mstreamRepo.matchSearch(exampleSongs[1], 'commando 9mm')).toBe(true)
    expect(mstreamRepo.matchSearch(exampleSongs[0], 'Commando 9MM')).toBe(false)
  })

  it('should handle song search', async () => {
    expect(mstreamRepo.search('Bad brains')).toBeInstanceOf(Promise)

    const results = await mstreamRepo.search('Commando 9mm')
    expect(results).toBeInstanceOf(Array)
    expect(results.length).toBe(1)
  })
})

describe('MstreamApiProvider.healthcheck', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  const make = () => new MstreamApiProvider({ baseUrl: 'https://mstream.example.com' }, 'mstream')

  it('returns connected when ping succeeds', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} } as never)
    const res = await make().healthcheck!()
    expect(res.status).toBe('connected')
    expect(typeof res.latencyMs).toBe('number')
  })

  it('returns unreachable on network error', async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('ECONNREFUSED'))
    const res = await make().healthcheck!()
    expect(res.status).toBe('unreachable')
    expect(res.error).toContain('ECONNREFUSED')
  })
})
