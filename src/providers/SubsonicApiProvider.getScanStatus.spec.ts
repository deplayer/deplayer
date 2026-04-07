import { describe, it, expect, vi, beforeEach } from 'vitest'
import SubsonicApiProvider from './SubsonicApiProvider'
import axios from 'axios'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

describe('SubsonicApiProvider.getScanStatus', () => {
  let provider: SubsonicApiProvider

  beforeEach(() => {
    vi.clearAllMocks()
    provider = new SubsonicApiProvider(
      { baseUrl: 'http://localhost', user: 'test', password: 'test' },
      'subsonic-1'
    )
  })

  it('should return scan status from server', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        'subsonic-response': {
          scanStatus: {
            scanning: false,
            count: 73014,
            lastScan: '2026-03-19T04:27:49.356885532Z',
          },
        },
      },
    })

    const result = await provider.getScanStatus()

    expect(result).toEqual({
      scanning: false,
      count: 73014,
      lastScan: '2026-03-19T04:27:49.356885532Z',
    })
    expect(mockedAxios.get).toHaveBeenCalledTimes(1)
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('/rest/getScanStatus.view')
    )
  })

  it('should handle scanning in progress', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        'subsonic-response': {
          scanStatus: {
            scanning: true,
            count: 73014,
            lastScan: '2026-03-19T04:27:49.356885532Z',
          },
        },
      },
    })

    const result = await provider.getScanStatus()
    expect(result.scanning).toBe(true)
  })
})
