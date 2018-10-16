// @flow

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import MstreamApiRepository from './MstreamApiRepository'
import Song from '../entities/Song'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /search
// arguments for reply are (status, data, headers)
mock.onGet(/db\/search/).reply(200, {
  albums: [],
  artists: []
})

describe('MstreamApiRepository', () => {
  const itunesRepo = new MstreamApiRepository()

  it('should handle song search', () => {
    expect(itunesRepo.search('Bad brains')).toBeInstanceOf(Promise)
  })

  it('search should return an array of songs', () => {
    expect.assertions(1)
    return itunesRepo.search('Bad brains').then((results: Array<Song>) => {
      expect(results.length).toBe(0)
    })
  })
})
