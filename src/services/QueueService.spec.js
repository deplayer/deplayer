// @flow

import QueueService from './QueueService'
import DummyAdapter from './adapters/DummyAdapter'
import { defaultState } from '../reducers/queue'

describe('QueueService', () => {
  it('should handle save', () => {
    const queueService = new QueueService(new DummyAdapter())

    expect.assertions(1)

    queueService.save('123', defaultState)
      .then((result) => {
        expect(result).toBeDefined()
      })
  })
})
