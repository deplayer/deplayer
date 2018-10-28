// @flow

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import exampleSongs from './mstreamExampleSongs.json'
import SubsonicApiRepository from './SubsonicApiRepository'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /db/album-songs
// arguments for reply are (status, data, headers)
mock.onGet(/rest\/search/).reply(200, { 'subsonic-response': {
  searchResult3: {
    song: exampleSongs
  }}})

describe('SubsonicApiRepository', () => {
  const mstreamRepo = new SubsonicApiRepository({baseUrl: ''})

  it('should handle song search', () => {
    expect.assertions(3)

    expect(mstreamRepo.search('Bad brains')).toBeInstanceOf(Promise)

    return mstreamRepo.search('Commando 9mm').then((results) => {
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(2)
    })
  })
})
