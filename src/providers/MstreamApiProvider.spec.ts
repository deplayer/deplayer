import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

import exampleSongs from './mstreamExampleSongs.json'
import MstreamApiProvider from './MstreamApiProvider'

// Setting mock to default instance
const mock = new MockAdapter(axios)

// Mock any GET request to /db/album-songs
// arguments for reply are (status, data, headers)
mock.onPost(/db\/album-songs/).reply(200, exampleSongs)

describe('MstreamApiProvider', () => {
  const mstreamRepo = new MstreamApiProvider({baseUrl: ''}, '')

  it('should matchSearch against song', () => {
    expect(mstreamRepo.matchSearch(exampleSongs[1], 'Commando 9MM')).toBe(true)
    expect(mstreamRepo.matchSearch(exampleSongs[1], 'commando 9mm')).toBe(true)
    expect(mstreamRepo.matchSearch(exampleSongs[0], 'Commando 9MM')).toBe(false)
  })

  it('should handle song search', async () => {
    expect(mstreamRepo.search('Bad brains')).toBeInstanceOf(Promise)

    const results = await  mstreamRepo.search('Commando 9mm')
    expect(results).toBeInstanceOf(Array)
    expect(results.length).toBe(1)
  })
})
