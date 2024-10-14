import { describe, it, expect } from 'vitest'
import QueueService from './QueueService'
import DummyAdapter from './database/DummyAdapter'
import { defaultState } from '../reducers/queue'

describe('QueueService', () => {
  it('should handle save', () => {
    const queueService = new QueueService(new DummyAdapter())

    queueService.save('123', defaultState)
      .then((result) => {
        expect(result).toBeDefined()
      })
  })
})
