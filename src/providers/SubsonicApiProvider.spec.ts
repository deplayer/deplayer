import axios from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'

import exampleSongs from './mstreamExampleSongs.json'
import SubsonicApiProvider from './SubsonicApiProvider'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /db/album-songs
// arguments for reply are (status, data, headers)
mock.onGet(/rest\/search/).reply(200, {
  'subsonic-response': {
    searchResult3: {
      song: exampleSongs,
      album: []
    }
  }
}
)

describe('SubsonicApiProvider', () => {
  const mstreamRepo = new SubsonicApiProvider({ baseUrl: '', user: 'test', password: 'test' }, 'subsonic')

  it('should handle song search', async () => {
    expect.assertions(3)

    expect(mstreamRepo.search('Bad brains')).toBeInstanceOf(Promise)

    return mstreamRepo.search('Commando 9mm').then((results) => {
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(2)
    })
  })
})

describe('SubsonicApiProvider.healthcheck', () => {
  beforeEach(() => { vi.restoreAllMocks() })

  const make = () => new SubsonicApiProvider(
    { baseUrl: 'https://nav.example.com', user: 'u', password: 'p' },
    'subsonic',
  )

  it('returns connected when ping responds with status="ok"', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: { 'subsonic-response': { status: 'ok', version: '1.16.1' } },
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('connected')
    expect(typeof res.checkedAt).toBe('number')
  })

  it('returns authFailed on error code 40', async () => {
    vi.spyOn(axios, 'get').mockResolvedValue({
      data: { 'subsonic-response': { status: 'failed', error: { code: 40, message: 'wrong password' } } },
    })
    const res = await make().healthcheck!()
    expect(res.status).toBe('authFailed')
    expect(res.error).toBe('wrong password')
  })

  it('returns unreachable on network error', async () => {
    vi.spyOn(axios, 'get').mockRejectedValue(new Error('ECONNREFUSED'))
    const res = await make().healthcheck!()
    expect(res.status).toBe('unreachable')
    expect(res.error).toContain('ECONNREFUSED')
    expect(typeof res.latencyMs).toBe('number')
  })
})
