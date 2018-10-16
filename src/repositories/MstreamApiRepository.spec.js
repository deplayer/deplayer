// @flow

import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import exampleSongs from './mstreamExampleSongs.json'
import MstreamApiRepository from './MstreamApiRepository'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /db/album-songs
// arguments for reply are (status, data, headers)
mock.onPost(/db\/album-songs/).reply(200, exampleSongs)

describe('MstreamApiRepository', () => {
  const mstreamRepo = new MstreamApiRepository()

  it('should handle song search', () => {
    expect.assertions(2)

    expect(mstreamRepo.search('Bad brains')).toBeInstanceOf(Promise)

    mstreamRepo.search('Commando 9mm').then((results) => {
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(1)
    })
  })
})
