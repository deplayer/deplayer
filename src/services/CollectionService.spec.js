// @flow

import CollectionService from './CollectionService'
import DummyAdapter from './adapters/DummyAdapter'

describe('CollectionService', () => {
  it('should handle save', () => {
    const collectionService = new CollectionService(new DummyAdapter())

    expect.assertions(1)

    collectionService.save('123', {mySetting: 'value'})
      .then((result) => {
        expect(result).toBeDefined()
      })
  })
})
