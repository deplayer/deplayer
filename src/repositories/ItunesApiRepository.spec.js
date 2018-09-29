// @flow

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import ItunesApiRepository from './ItunesApiRepository'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /search
// arguments for reply are (status, data, headers)
mock.onGet(/search/).reply(200, {
  result: [
    { id: 1, title: 'Rock the Casbah' }
  ]
})

describe('ItunesApiRepository', () => {
  it('should handle song search', () => {
    const itunesRepo = new ItunesApiRepository()
    expect(itunesRepo.search('Bad brains')).toBeInstanceOf(Promise)
  })
})
