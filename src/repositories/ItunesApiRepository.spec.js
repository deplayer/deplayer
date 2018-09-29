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
  const itunesRepo = new ItunesApiRepository()

  it('should handle song search', () => {
    expect(itunesRepo.search('Bad brains')).toBeInstanceOf(Promise)
  })

  it('should populate itunes api url from searchTerm', () => {
    expect(itunesRepo.populateUrl('Bad brains')).toBe('https://itunes.apple.com/search?term=Bad%20brains')
  })
})
