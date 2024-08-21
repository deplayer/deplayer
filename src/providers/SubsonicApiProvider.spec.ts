import axios from 'axios'
import { describe, it, expect } from 'vitest'
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
  const mstreamRepo = new SubsonicApiProvider({ baseUrl: '' }, 'subsonic')

  it('should handle song search', async () => {
    expect.assertions(3)

    expect(mstreamRepo.search('Bad brains')).toBeInstanceOf(Promise)

    return mstreamRepo.search('Commando 9mm').then((results) => {
      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(2)
    })
  })
})
