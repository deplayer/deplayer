import PlaylistService from './PlaylistService'
import DummyAdapter from './database/DummyAdapter'
import { defaultState } from '../reducers/playlist'

describe('PlaylistService', () => {
  it('should handle save', () => {
    const queueService = new PlaylistService(new DummyAdapter())

    expect.assertions(1)

    queueService.save('123', defaultState)
      .then((result) => {
        expect(result).toBeDefined()
      })
  })
})
